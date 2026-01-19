# Manual de Usuario - NTMS Sistema de Gestión de Grúas

## Índice
1. [Introducción](#1-introducción)
2. [Instalación y Configuración](#2-instalación-y-configuración)
3. [Funcionalidades Principales](#3-funcionalidades-principales)
4. [Solución de Problemas](#4-solución-de-problemas)
5. [Preguntas Frecuentes (FAQ)](#5-preguntas-frecuentes-faq)
6. [Glosario de Términos](#6-glosario-de-términos)

---

## 1. Introducción

### Propósito del Sistema
El **NTMS (Sistema de Gestión de Grúas)** es una plataforma integral diseñada para la administración eficiente de empresas de grúas. Permite gestionar operaciones, facturación, inventario, proveedores, flota y recursos humanos en un entorno centralizado y seguro.

### Público Objetivo
Este manual está dirigido a los siguientes perfiles de usuario:
- **Administradores de Empresa**: Responsables de la configuración general y gestión del negocio.
- **Despachadores (Dispatchers)**: Encargados de la asignación y seguimiento de servicios y operadores.
- **Operadores**: Personal en campo que ejecuta los servicios de grúa.
- **Personal Administrativo**: Encargados de facturación y cobranza.

### Requisitos Previos
Para utilizar el sistema, es necesario contar con:
- Un dispositivo con conexión a internet (Computadora, Tablet o Smartphone).
- Un navegador web moderno (Google Chrome, Mozilla Firefox, Safari o Microsoft Edge).
- Credenciales de acceso (Correo electrónico y contraseña) proporcionadas por el administrador.

---

## 2. Instalación y Configuración

### Requerimientos del Sistema
El sistema opera en la nube, por lo que no requiere instalación de software local en las estaciones de trabajo.
- **Hardware**: Cualquier dispositivo capaz de ejecutar un navegador web moderno.
- **Software**: Navegador web actualizado.

### Acceso al Sistema
1. Abra su navegador web.
2. Navegue a la URL del sistema (proporcionada por su proveedor).
3. Ingrese su correo electrónico y contraseña en la pantalla de inicio de sesión.
4. Haga clic en "Iniciar Sesión".

### Configuración Inicial (Para Administradores)
Al ingresar por primera vez como administrador de una nueva empresa (Tenant):

1. **Perfil de Empresa**:
   - Diríjase a `Configuración > Empresa`.
   - Complete la información fiscal (RFC, Razón Social, Dirección).
   - Suba el logotipo de la empresa y configure los colores corporativos para personalizar la interfaz.

2. **Gestión de Usuarios y Roles**:
   - Vaya a `Configuración > Usuarios`.
   - Invite a nuevos usuarios mediante su correo electrónico.
   - Asigne roles específicos (`admin`, `dispatcher`, `operator`) según las funciones de cada empleado.

3. **Configuración de Catálogos**:
   - Configure las listas de precios, tipos de servicios y zonas de cobertura en el módulo de configuración.

---

## 3. Funcionalidades Principales

### Panel de Control (Dashboard)
Una vista general del estado de la empresa que incluye:
- Gráficas de ingresos y servicios recientes.
- Indicadores clave de rendimiento (KPIs).
- Alertas de mantenimiento y documentos vencidos.

### Gestión de Clientes
Módulo para administrar la base de datos de clientes (`clients`).
- **Tipos de Clientes**: Particulares, Empresas, Aseguradoras, Gobierno.
- **Funciones**:
  - Registro de datos fiscales y contactos.
  - Historial de servicios y facturación.
  - Configuración de condiciones de crédito y límites.

### Gestión de Flota (Grúas)
Control total sobre los vehículos de la empresa (`cranes`).
- **Registro**: Información técnica, placas, número de unidad.
- **Documentación**: Control de seguros, permisos y verificaciones con alertas de vencimiento.
- **Mantenimiento**: Programación y seguimiento de mantenimientos preventivos y correctivos.

### Gestión de Operadores
Administración del personal operativo (`operators`).
- **Perfiles**: Datos personales, licencias, certificaciones médicas.
- **Comisiones**: Configuración de esquemas de pago (porcentaje, fijo o mixto).
- **Documentos**: Almacenamiento digital de licencias y certificaciones.

### Operaciones y Servicios
El núcleo del sistema para la gestión del trabajo diario.
- **Creación de Servicios**: Registro de solicitudes con origen, destino, cliente y tipo de grúa requerida.
- **Pipeline de Servicios**: Tablero visual (Kanban) para mover servicios entre estados (Pendiente, En Curso, Terminado, Facturado).
- **Asignación**: Vinculación de operadores y grúas a servicios específicos.

### Facturación y Finanzas
- **Facturación**: Generación de facturas electrónicas a partir de servicios completados.
- **Cobranza**: Seguimiento de facturas pendientes y registro de pagos.
- **Costos**: Registro de gastos operativos asociados a vehículos o servicios.

### Inventario
Control de refacciones y herramientas.
- Entradas y salidas de almacén.
- Asignación de herramientas a unidades específicas.

### Reportes
Generación de informes detallados para la toma de decisiones:
- Reportes financieros (Ingresos, Gastos).
- Reportes operativos (Servicios por operador, Eficiencia de flota).

---

## 4. Solución de Problemas

### Problemas Frecuentes

**No puedo iniciar sesión**
- Verifique que su correo y contraseña sean correctos.
- Asegúrese de que su cuenta no esté suspendida.
- Utilice la opción "¿Olvidaste tu contraseña?" para restablecerla.

**No veo ciertos módulos en el menú**
- Esto se debe a los permisos de su rol. Contacte a su administrador si necesita acceso adicional.

**Error al subir archivos**
- Verifique que el archivo no exceda el límite de tamaño permitido (generalmente 5MB).
- Asegúrese de que el formato sea compatible (PDF, JPG, PNG).

### Códigos de Error Comunes
- **401 Unauthorized**: Su sesión ha expirado o no tiene permiso para realizar esta acción. Inicie sesión nuevamente.
- **404 Not Found**: El recurso que busca (servicio, cliente, etc.) no existe o fue eliminado.
- **500 Server Error**: Error interno del sistema. Contacte a soporte técnico.

### Contacto para Soporte Técnico
Si el problema persiste, contacte al equipo de soporte:
- **Email**: soporte@ntms.com
- **Teléfono**: +52 (55) 1234-5678
- **Horario**: Lunes a Viernes, 9:00 AM - 6:00 PM

---

## 5. Preguntas Frecuentes (FAQ)

**¿Puedo usar el sistema desde mi celular?**
Sí, el sistema es responsivo y se adapta a pantallas de dispositivos móviles, permitiendo a los operadores gestionar servicios desde el campo.

**¿Mis datos están seguros?**
Sí, utilizamos encriptación y aislamiento de datos (Multi-Tenant) para asegurar que la información de su empresa sea privada y segura.

**¿Cómo agrego una nueva grúa?**
Vaya al módulo de "Flota", haga clic en "Nueva Grúa" y complete el formulario con la información del vehículo.

**¿Qué hago si un operador olvida su contraseña?**
Un administrador puede enviar un correo de restablecimiento de contraseña desde el módulo de Usuarios.

---

## 6. Glosario de Términos

- **Tenant**: Se refiere a la "Empresa" o "Organización" dentro del sistema. Cada tenant tiene sus propios datos aislados.
- **Dispatcher**: Rol de usuario encargado de la logística y asignación de servicios.
- **RLS (Row Level Security)**: Tecnología de seguridad que garantiza que cada usuario solo vea los datos que le corresponden.
- **Pipeline**: Vista visual del flujo de trabajo donde los servicios se representan como tarjetas que avanzan por diferentes etapas.
- **PO (Purchase Order)**: Orden de Compra, documento requerido por algunos clientes para procesar la facturación.
