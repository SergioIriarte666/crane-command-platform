# Manual de Despliegue y Desarrollo - Crane Command Platform (NTMS)

Este documento sirve como guía exhaustiva para el desarrollo, configuración y despliegue de la plataforma **NTMS (Sistema de Gestión de Grúas)**. Está diseñado para ser seguido por desarrolladores y administradores del sistema, independientemente de su nivel técnico.

---

## 1. Introducción y Visión General

### Propósito del Proyecto
**Crane Command Platform (NTMS)** es una aplicación web moderna diseñada para la gestión integral de operaciones de grúas y maquinaria pesada. Permite administrar inventarios, clientes, proveedores, flotas y generar reportes operativos y financieros.

### Tecnologías Clave
El proyecto utiliza una arquitectura **Serverless** moderna:
*   **Frontend:** [React](https://react.dev/) + [Vite](https://vitejs.dev/) (Framework de desarrollo rápido).
*   **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (JavaScript tipado para mayor seguridad).
*   **Estilos:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/).
*   **Backend & Base de Datos:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime).
*   **Despliegue (Hosting):** [Vercel](https://vercel.com/).

### Arquitectura de Alto Nivel
```mermaid
graph TD
    A[Usuario (Navegador)] -->|HTTPS| B[Vercel (Frontend React)]
    B -->|API REST / Websockets| C[Supabase (Backend)]
    C -->|Auth| D[Autenticación]
    C -->|Data| E[Base de Datos PostgreSQL]
    C -->|Storage| F[Almacenamiento de Archivos]
```

---

## 2. Configuración del Entorno de Desarrollo

Sigue estos pasos para trabajar en el proyecto desde tu computadora local.

### Prerrequisitos
Antes de empezar, descarga e instala:
1.  **Node.js (v18 o superior):** [Descargar aquí](https://nodejs.org/). Permite ejecutar el entorno de desarrollo.
2.  **Git:** [Descargar aquí](https://git-scm.com/). Para el control de versiones.
3.  **Visual Studio Code (IDE recomendado):** [Descargar aquí](https://code.visualstudio.com/).

### Clonar el Repositorio
Abre tu terminal (o consola de comandos) y ejecuta:

```bash
# Clona el proyecto en tu carpeta actual
git clone https://github.com/SergioIriarte666/crane-command-platform.git

# Entra a la carpeta del proyecto
cd crane-command-platform
```

### Instalar Dependencias
Instala las librerías necesarias para que el proyecto funcione:

```bash
npm install
```
> **Nota:** Esto creará una carpeta `node_modules`. No debes modificar esta carpeta manualmente.

---

## 3. Configuración y Conexión con Servicios Externos

El proyecto necesita conectarse a **Supabase** para funcionar (login, datos, etc.).

### Configuración de Supabase
1.  Crea una cuenta en [Supabase](https://supabase.com/) y un nuevo proyecto.
2.  Ve a **Project Settings > API**.
3.  Copia los siguientes valores:
    *   **Project URL**
    *   **Project API Key (anon/public)**

### Variables de Entorno Locales
Crea un archivo llamado `.env` en la raíz del proyecto (puedes copiar el archivo `.env.example` si existe) y agrega tus credenciales:

```env
VITE_SUPABASE_URL=https://tu-proyecto-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu-clave-anon-publica-larga
```
> ⚠️ **Advertencia:** Nunca subas este archivo `.env` a GitHub si contiene claves secretas de producción (service_role). Las claves `anon` son seguras de exponer en el frontend.

### Configuración Inicial de Base de Datos
Para aplicar la estructura de tablas (esquema) a tu nuevo proyecto de Supabase:

1.  Instala Supabase CLI si no lo tienes: `npm install -g supabase`
2.  Inicia sesión: `npx supabase login`
3.  Vincula tu proyecto: `npx supabase link --project-ref tu-project-id`
4.  Sube las migraciones: `npx supabase db push`

---

## 4. Desarrollo y Ejecución Local

### Iniciar Servidor de Desarrollo
Para ver la aplicación en tu navegador mientras programas:

```bash
npm run dev
```
Verás un mensaje como: `Local: http://localhost:8080/`. Abre ese enlace en tu navegador.

### Flujo de Trabajo con Git
Para guardar y subir tus cambios:

1.  **Crear una rama (opcional pero recomendado):**
    ```bash
    git checkout -b feature/nueva-funcionalidad
    ```
2.  **Guardar cambios (Commit):**
    ```bash
    git add .
    git commit -m "Descripción breve de lo que hiciste"
    ```
3.  **Subir cambios (Push):**
    ```bash
    git push origin nombre-de-tu-rama
    # O si estás en main:
    git push origin main
    ```

---

## 5. Despliegue en Producción (Vercel)

El despliegue es automático gracias a Vercel.

### Conectar con Vercel
1.  Crea una cuenta en [Vercel](https://vercel.com/).
2.  Haz clic en **"Add New Project"** e importa tu repositorio de GitHub.
3.  Vercel detectará que es un proyecto **Vite**.

### Variables de Entorno en Vercel (CRÍTICO)
Antes de darle a "Deploy", busca la sección **Environment Variables** y agrega las mismas que pusiste en tu `.env` local:

*   `VITE_SUPABASE_URL`: Tu URL de Supabase.
*   `VITE_SUPABASE_PUBLISHABLE_KEY`: Tu clave anon de Supabase.

### Despliegue Automático
Una vez configurado, cada vez que hagas un `git push` a la rama `main`, Vercel actualizará tu sitio web automáticamente en unos minutos.

---

## 6. Configuración de Dominio y DNS

Para que tu sitio sea accesible en `www.ntms.cl`.

### En Vercel
1.  Ve a tu proyecto en Vercel > **Settings > Domains**.
2.  Escribe `www.ntms.cl` y haz clic en **Add**.
3.  Agrega también `ntms.cl` (sin www) para que redirija automáticamente.

### En NIC Chile (o tu registrador)
1.  Ingresa a [nic.cl](https://www.nic.cl).
2.  Selecciona tu dominio.
3.  En la sección **Servidores de Nombre (DNS)**, elimina los existentes y agrega los de Vercel:
    *   `ns1.vercel-dns.com`
    *   `ns2.vercel-dns.com`
4.  Guarda los cambios.

> **Nota:** La propagación de DNS puede tardar desde 30 minutos hasta 24 horas. Durante este tiempo, es posible que el sitio no cargue para todos los usuarios.

---

## 7. Mantenimiento y Solución de Problemas

### Actualizaciones
Mantén tus librerías al día para evitar fallos de seguridad:
```bash
npm update
```
*Revisa siempre que la aplicación siga funcionando después de actualizar.*

### Backups (Respaldos)
Supabase realiza backups diarios automáticos en el plan Pro. En el plan gratuito, se recomienda exportar la base de datos manualmente desde el panel de Supabase:
*   **Database > Backups > Download (SQL)**

### Debugging (Solución de Errores)
*   **Error de conexión:** Verifica que las variables de entorno en Vercel sean correctas.
*   **Pantalla blanca:** Abre la consola del navegador (F12 > Console) para ver errores de JavaScript.
*   **Logs de Vercel:** En el dashboard de Vercel, ve a la pestaña "Logs" para ver errores del servidor o del proceso de construcción.

---

## 8. Glosario Técnico

*   **Repositorio (Repo):** Lugar donde se almacena todo el código del proyecto (GitHub).
*   **Commit:** Una "foto" o guardado de tus cambios en el código.
*   **Deploy (Despliegue):** El proceso de publicar tu código para que sea accesible en internet.
*   **Variables de Entorno:** Valores secretos (como contraseñas o claves API) que no se escriben directamente en el código por seguridad.
*   **DNS (Sistema de Nombres de Dominio):** La "agenda telefónica" de internet que traduce `google.com` a una dirección IP numérica.
*   **Endpoint:** Una dirección específica (URL) de la API donde el frontend pide o envía datos.
