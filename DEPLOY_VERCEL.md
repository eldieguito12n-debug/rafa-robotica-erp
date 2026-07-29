# 🚀 Deploy ROBOLAB ERP en Vercel (Paso a Paso)

> **Requisito:** Tener cuenta en [vercel.com](https://vercel.com) (gratis está bien para empezar)

---

## 🗂️ **Estructura de 2 proyectos** en Vercel

Vercel funciona mejor si creamos **2 Proyectos separados**:
1. 🔵 **`robolab-frontend`** → Carpeta `RoboLabERP/frontend` (React + Vite)
2. 🟢 **`robolab-backend`** → Carpeta `RoboLabERP/backend` (FastAPI serverless + Mangum)

---

## 🟢 **PASO 1: Crear base de datos Vercel Postgres**

1. Entra a https://vercel.com/dashboard → **Storage** → **Create Database**
2. Elige **PostgreSQL** (beta, gratis 256MB = suficiente para demo/producción pequeña)
3. Nombre: `robolab-db` | Región: **Washington DC IAD1** (o la más cercana)
4. Clic en **Create** y espera 30 segundos.
5. Listo! Vercel ya inyecta automáticamente la variable `POSTGRES_URL` en cualquier proyecto de Vercel que le conectes esta base de datos.
6. ⚡ **Conecta esta DB AMBOS proyectos** (frontend + backend), de esa forma:
   - Backend: usa `POSTGRES_URL` para guardar datos.
   - Frontend: no la necesita, pero es buena práctica conectarla.

---

## 🟢 **PASO 2: Deploy del BACKEND (FastAPI)**

1. En Vercel: **Add New Project**
2. **Import Git Repository** donde está tu código RoboLabERP.
3. Al configurar el proyecto:
   - **Name:** `robolab-backend`
   - **Root Directory:** 👉 haz clic en **Edit** y escribe **`backend`** (OJO, esto es MUY importante: Vercel solo compilará la subcarpeta backend).
   - **Framework Preset:** `Other`
   - **Build Command:** (déjalo vacío o escribe `echo ok`)
   - **Install Command:** (default Vercel: `pip install -r requirements.txt`)
   - **Output Directory:** déjalo vacío o `.`
4. Clic en **Deploy**
5. ⏳ Espera 1-3 minutos mientras instala `fastapi`, `mangum`, `sqlalchemy`, `psycopg2-binary`, etc.
6. Si el deploy sale exitoso: guarda la URL que Vercel le asignó.
   **Ejemplo:** `https://robolab-backend-tudominio.vercel.app`
7. 🧪 Prueba Swagger: Entra a `https://TU-BACKEND.vercel.app/docs`
   - Si ves la UI de FastAPI Swagger ✅ BACKEND LISTO

> 💡 **Nota:** El archivo `backend/api/index.py` es el entry point serverless Mangum que Vercel ejecuta. Las rutas son `/api/v1/*`, `/docs`, `/openapi.json`.

---

## 🔵 **PASO 3: Deploy del FRONTEND (React + Vite)**

1. **Add New Project** → importa el mismo repo (sí, Vercel puede usar 1 repo para múltiples proyectos con distinto Root Dir).
2. Configuración:
   - **Name:** `robolab-erp` (tu nombre principal)
   - **Root Directory:** 👉 **`frontend`** (muy importante)
   - **Framework Preset:** **Vite** (Vercel lo detecta solo, si no: escógelo tú)
   - **Build Command:** (auto) `npm run build`
   - **Output Directory:** (auto) `dist`
3. 📋 Añade esta **Environment Variable** (antes de hacer Deploy!):
   | KEY | VALUE |
   |-----|-------|
   | `VITE_API_URL` | `https://TU-BACKEND.vercel.app/api/v1`  (Pega la URL de tu backend del PASO 2, incluyendo `/api/v1`) |
4. Clic **Deploy**
5. Espera 1-2 minutos mientras hace `npm install && npm run build`.
6. Listo! Ahora entra a la URL del frontend.
   **Ejemplo:** `https://robolab-erp.vercel.app`
7. 🧪 Prueba login con credenciales demo:
   - **admin@robolab.com** / **admin123**
   - **jefe@robolab.com** / **jefe123**
8. ✅ Si logueas y ves Dashboard con KPIs y datos — TODO FUNCIONA.

---

## 🛡️ **PASO 4: Seguridad - Cambia claves de producción**

**En el proyecto Backend** → Settings → Environment Variables. **Agrega 2 variables OBLIGATORIAS:**

| KEY | VALUE (cambia estos valores!) |
|---|---|
| `SECRET_KEY` | string aleatorio MUY largo, ej: `openssl rand -base64 64` y pega el resultado |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (=24h) o `480` para 8h |

Re-deploya el backend para que aplique.

---

## 🧑‍💼 **PASO 5: Cómo funciona el Registro de Trabajadores**

Solo **2 roles** pueden crear cuentas:
- 🛡️ **Administrador**
- 🧑‍💼 **Jefe de Desarrollo**

**Cómo crear un trabajador:**
1. Inicia sesión como Admin / Jefe
2. Menú → **Gestión → Usuarios**
3. Clic en **Nuevo Trabajador** (botón azul, parte superior derecha)
4. Llena el formulario modal:
   - Nombre, Email, Teléfono (opcional), Rol, Contraseña (tiene botón **Generar** para clave aleatoria tipo `RoboLab-AB12CD`)
5. Clic **Crear Trabajador**
6. ✅ Cuenta creada. Comparte email + contraseña con el trabajador.

> La ruta `/register` PÚBLICA fue eliminada. Nadie puede registrarse por sí solo — el jefe controla el acceso.

---

## 🧪 **Tabla de credenciales demo (seed data)**

Primer inicio: el backend **inserta automáticamente** estos usuarios (si no existen):

| Usuario          | Email                 | Contraseña  | Rol                 |
|------------------|-----------------------|-------------|---------------------|
| Diego Admin      | admin@robolab.com     | admin123    | Administrador       |
| Laura Jefe       | jefe@robolab.com      | jefe123     | Jefe de Desarrollo  |
| Carlos Dev       | dev@robolab.com       | dev123      | Programador         |
| Fernanda Tecnico | tecnico@robolab.com   | tec123      | Técnico             |
| Oscar Contador   | contador@robolab.com  | cont123     | Contador            |
| Cliente Demo     | cliente@robolab.com   | cli123      | Cliente             |

También crea: **6 Laboratorios**, **12 items Inventario**, **3 Proyectos**, **8 Tareas**, registros financieros y desarrolladores.

---

## 🆘 Troubleshooting común

1. **CORS / Login falla (Network Error):** Verifica que `VITE_API_URL` en el Frontend apunte a `https://TU-BACKEND.vercel.app/api/v1` (sin `/` al final). Re-deploya frontend después de cambiarla.
2. **500 Error DB:** La seed SQL falla en Vercel cuando SQLite estaba previamente activo. Asegura que `POSTGRES_URL` exista en variables backend.
3. **`psycopg2-binary` falla instalar:** Vercel Python 3.12/3.11 ya trae wheels precompilados. Usa Python 3.11 en settings de proyecto Vercel (menos bugs con psycopg2).
4. **403 Forbidden al registrar usuario:** El backend lo bloquea si no eres `administrador` o `jefe_desarrollo`. Inicia sesión con el admin o jefe primero.
5. **504 Timeout Mangum:** Algunos endpoints pesados (reportes grandes) pueden necesitar convertir la lógica a tareas async/background.

---

## 🛣️ **Dominio personalizado (opcional)**

- Ve a `robolab-erp` (frontend) → Settings → Domains
- Añade `erp.tudominio.com` → Crea los registros DNS que Vercel te indica.
- Asigna mismo dominio al backend: `api.erp.tudominio.com` → actualiza `VITE_API_URL` a `https://api.erp.tudominio.com/api/v1` y re-deploya frontend.

---

💡 ¡Listo! Tu ERP RoboLab está **100% en producción** con dominio global, HTTPS automático, base de datos Postgres administrada, y escalado serverless infinito.
