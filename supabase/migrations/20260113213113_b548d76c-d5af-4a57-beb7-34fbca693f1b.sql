-- ===========================================
-- FASE 1: SISTEMA MULTI-TENANT Y AUTENTICACIÓN
-- NTMS - Sistema de Gestión de Grúas
-- ===========================================

-- 1. ENUM DE ROLES
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'dispatcher', 'operator');

-- 2. TABLA DE TENANTS (EMPRESAS)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#2563eb',
    address TEXT,
    phone TEXT,
    email TEXT,
    tax_id TEXT, -- RFC
    plan TEXT DEFAULT 'basic' CHECK (plan IN ('basic', 'professional', 'enterprise')),
    is_active BOOLEAN DEFAULT true,
    max_users INTEGER DEFAULT 5,
    max_cranes INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA DE PERFILES DE USUARIO
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABLA DE ROLES DE USUARIO (separada para seguridad)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'operator',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, tenant_id, role)
);

-- 5. HABILITAR RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. FUNCIÓN SECURITY DEFINER PARA VERIFICAR ROLES
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- 7. FUNCIÓN PARA OBTENER TENANT_ID DEL USUARIO
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT tenant_id
    FROM public.profiles
    WHERE id = _user_id
    LIMIT 1
$$;

-- 8. FUNCIÓN PARA VERIFICAR SI ES SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = 'super_admin'
        AND tenant_id IS NULL
    )
$$;

-- 9. POLÍTICAS RLS PARA TENANTS
-- Super admins pueden ver todos los tenants
CREATE POLICY "Super admins can view all tenants"
ON public.tenants FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Super admins pueden crear tenants
CREATE POLICY "Super admins can create tenants"
ON public.tenants FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

-- Super admins pueden actualizar tenants
CREATE POLICY "Super admins can update tenants"
ON public.tenants FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Usuarios pueden ver su propio tenant
CREATE POLICY "Users can view their own tenant"
ON public.tenants FOR SELECT
TO authenticated
USING (id = public.get_user_tenant_id(auth.uid()));

-- 10. POLÍTICAS RLS PARA PROFILES
-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Admins pueden ver perfiles de su tenant
CREATE POLICY "Admins can view tenant profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dispatcher'))
);

-- Admins pueden crear perfiles en su tenant
CREATE POLICY "Admins can create tenant profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
);

-- Super admins pueden ver todos los perfiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- 11. POLÍTICAS RLS PARA USER_ROLES
-- Usuarios pueden ver sus propios roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins pueden ver roles de su tenant
CREATE POLICY "Admins can view tenant roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
);

-- Admins pueden asignar roles en su tenant (excepto super_admin)
CREATE POLICY "Admins can assign roles in tenant"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
    AND role != 'super_admin'
);

-- Admins pueden actualizar roles en su tenant
CREATE POLICY "Admins can update roles in tenant"
ON public.user_roles FOR UPDATE
TO authenticated
USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
    AND role != 'super_admin'
);

-- Super admins pueden ver todos los roles
CREATE POLICY "Super admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Super admins pueden crear cualquier rol
CREATE POLICY "Super admins can create any role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

-- 12. TRIGGER PARA CREAR PERFIL AL REGISTRARSE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. TRIGGER PARA ACTUALIZAR updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_tenant_id ON public.user_roles(tenant_id);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_is_active ON public.tenants(is_active);