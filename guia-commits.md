# Guía completa de flujo de trabajo con Git

Esta guía cubre el flujo típico de un desarrollador que trabaja con Git y GitHub:

1. Clonar el repositorio por primera vez.  
2. Configurar nombre y correo.  
3. Flujo diario de trabajo con ramas.  
4. Crear commits y subir cambios.  
5. Crear Pull Requests y buenas prácticas.  

---

## 1. Clonación del repositorio

### 1.1. Clonar el repositorio remoto

Ejemplo con tu repositorio:

```bash
git clone https://github.com/SergioIriarte666/crane-command-platform.git
```

En general:

```bash
git clone ${url_repositorio}
```

Esto crea una carpeta con el código. Entra en ella:

```bash
cd crane-command-platform
```

### 1.2. Configuración inicial de usuario

Solo necesitas hacerlo una vez por máquina (o cuando quieras cambiar tus datos).

Configurar nombre:

```bash
git config --global user.name "Tu Nombre"
```

Configurar correo (debe coincidir con el de tu cuenta de GitHub para que los commits se asocien bien):

```bash
git config --global user.email "tu-correo@ejemplo.com"
```

Verificar configuración:

```bash
git config --global --list
```

---

## 2. Flujo de trabajo diario

### 2.1. Actualizar la rama principal

Antes de empezar a trabajar cada día, asegúrate de tener la última versión de la rama principal (por ejemplo `main`):

```bash
git checkout main
git pull origin main
```

En general:

```bash
git pull origin ${rama_principal}
```

### 2.2. Crear una nueva rama para tu trabajo

Trabaja siempre en una rama diferente a `main`. Crea una rama descriptiva para la tarea:

```bash
git checkout -b feature/sidebar-colapsable
```

En general:

```bash
git checkout -b ${nombre_rama}
```

Ejemplos de nombres de rama:

- `feature/nueva-apariencia-configuracion`
- `fix/bug-flash-tema-apariencia`
- `chore/actualizar-dependencias`

### 2.3. Ver estado de cambios

A medida que trabajas en el código, puedes ver qué archivos cambiaste:

```bash
git status
```

Interpretación:

- Archivos en rojo: modificados pero **no** preparados (no están en *stage*).
- Archivos en verde: ya preparados para el commit.

---

## 3. Proceso de commit

### 3.1. Agregar cambios (stage)

#### Opción A: todos los archivos modificados

```bash
git add .
```

#### Opción B: archivo por archivo

```bash
git add src/components/settings/AppearanceSettings.tsx
git add src/components/ui/sidebar.tsx
```

En general:

```bash
git add ${archivos}
```

Vuelve a revisar:

```bash
git status
```

Los archivos que vas a commitear deben verse en verde bajo **“Changes to be committed”**.

### 3.2. Ver diferencias antes de commitear

Para revisar exactamente qué vas a subir:

```bash
git diff --staged
```

Esto muestra los cambios de los archivos que ya están en *stage*.

### 3.3. Crear el commit

```bash
git commit -m "Mensaje descriptivo del cambio"
```

En general:

```bash
git commit -m "${mensaje_descriptivo}"
```

Ejemplos concretos:

```bash
git commit -m "Agregar colapso del sidebar con animaciones suaves"
git commit -m "Corregir flash al cambiar tema en configuración/apariencia"
git commit -m "Actualizar color primario desde preferencias de usuario"
```

---

## 4. Subida de cambios y Pull Request

### 4.1. Subir la rama al remoto

Si la rama es nueva (primera vez que haces push):

```bash
git push -u origin feature/sidebar-colapsable
```

En general:

```bash
git push -u origin ${nombre_rama}
```

La opción `-u` (o `--set-upstream`) enlaza la rama local con la remota. Después de eso, podrás usar simplemente:

```bash
git push
```

### 4.2. Crear un Pull Request en GitHub

Pasos típicos en GitHub:

1. Ve a la página del repositorio en GitHub.  
2. GitHub suele mostrar un aviso: **“Compare & pull request”** para la rama que acabas de pushear. Haz clic ahí.  
3. Verifica que la base sea `main` (o la rama principal) y la rama de comparación sea tu rama (`feature/...`).  
4. Escribe un título descriptivo para el PR:
   - Ej: `Agregar sidebar colapsable con estado persistente`
5. En la descripción, explica brevemente:
   - Qué se hizo.
   - Cómo probarlo.
   - Si hay algo pendiente o conocido.
6. Crea el Pull Request.  

Cuando el PR se revise y apruebe, se hace el **merge** a `main`. Luego, localmente:

```bash
git checkout main
git pull origin main
git branch -d feature/sidebar-colapsable
```

La última línea borra la rama local ya fusionada (opcional pero recomendable para mantener limpio el repositorio).

---

## 5. Buenas prácticas

### 5.1. Estructura de mensajes de commit

Recomendaciones:

- Usa infinitivo al inicio:
  - `Agregar`, `Actualizar`, `Corregir`, `Refactorizar`, `Eliminar`, `Documentar`.
- Sé específico:
  - Mejor: `Corregir flash al cambiar tema en apariencia`
  - Peor: `Arreglar cosas`
- Si tu proyecto lo requiere, puedes usar prefijos:
  - `feat: Agregar sidebar colapsable`
  - `fix: Corregir bug de tema en apariencia`
  - `chore: Actualizar dependencias de React`

### 5.2. Frecuencia recomendada de commits

- Prefiere commits pequeños y frecuentes:
  - Un commit por funcionalidad o cambio lógico.
  - Ejemplo:
    - Commit 1: `Agregar botón para colapsar sidebar`
    - Commit 2: `Persistir estado del sidebar en localStorage`
    - Commit 3: `Ajustar animaciones del sidebar`
- Evita:
  - Commits gigantes tipo `big changes` con muchos archivos mezclados.

### 5.3. Manejo básico de conflictos

Los conflictos aparecen generalmente al hacer `git pull` o al hacer merge de ramas.

Ejemplo de flujo:

```bash
git pull origin main
```

Si hay conflictos, Git te avisará qué archivos están en conflicto. En esos archivos verás marcas como:

```text
<<<<<<< HEAD
tu versión local
=======
versión remota
>>>>>>> main
```

Pasos para resolver:

1. Abrir el archivo en conflicto.  
2. Elegir qué partes conservar (local, remota o una combinación).  
3. Eliminar las marcas `<<<<<<<`, `=======`, `>>>>>>>`.  
4. Marcar el conflicto como resuelto añadiendo el archivo:
   ```bash
   git add archivo-en-conflicto.tsx
   ```
5. Continuar el proceso según el comando que estabas ejecutando:
   - Si estabas haciendo `git pull` con merge:
     ```bash
     git commit
     ```

### 5.4. Errores comunes y soluciones rápidas

- **`nothing added to commit` o `Changes not staged for commit`**  
  - Causa: no preparaste los archivos.  
  - Solución:
    ```bash
    git add .
    git commit -m "Mensaje del commit"
    ```

- **`Updates were rejected because the remote contains work that you do not have`**  
  - Causa: hay cambios en el remoto que no tienes localmente.  
  - Solución:
    ```bash
    git pull origin main
    # Resolver conflictos si aparecen
    git push origin main
    ```

---

## 6. Resumen rápido del flujo recomendado

1. Al empezar el día:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Crear rama para la tarea:
   ```bash
   git checkout -b feature/nombre-descriptivo
   ```
3. Trabajar y repetir este ciclo:
   ```bash
   git status
   git add .
   git diff --staged
   git commit -m "Mensaje claro del cambio"
   ```
4. Subir la rama:
   ```bash
   git push -u origin feature/nombre-descriptivo
   ```
5. Crear Pull Request en GitHub hacia `main`.  
6. Tras el merge:
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/nombre-descriptivo
   ```

