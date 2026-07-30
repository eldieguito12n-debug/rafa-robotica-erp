# 🤖 RoboLab ERP

Sistema Integral de Gestión para Laboratorios de Robótica. Controla proyectos, inventario, finanzas, tareas, personal y laboratorios — todo en uno, con asistente de IA integrado.

Stack: **FastAPI (Python) + SQLAlchemy + SQLite/PostgreSQL | React 18 + Vite + TailwindCSS 3**

---

## 🚀 Inicio Rápido (3 pasos)

### 1️⃣ Instalar dependencias

```bash
# Desde la carpeta raíz del proyecto
npm run install:all
```

Esto instala:
- Node (concurrently) en la raíz
- Dependencias Python (FastAPI, SQLAlchemy, reportlab, openpyxl...) en `/backend`
- Dependencias React (Vite, Tailwind, framer-motion, recharts...) en `/frontend`

### 2️⃣ (Opcional) Configurar variables

Copia los archivos de ejemplo y ajusta a gusto:

```bash
# Backend (usa SQLite por defecto, NO necesitas configurar nada!)
copy backend\.env.example backend\.env   # Windows
# cp backend/.env.example backend/.env  # Linux/Mac

# Frontend
copy frontend\.env.example frontend\.env
```

### 3️⃣ ¡A correr ambos!

```bash
npm run dev
```

Automáticamente se abren:
- **Backend (API):** http://localhost:8000 — documentación Swagger en http://localhost:8000/docs
- **Frontend (App):** http://localhost:5173 — aquí interactúas con el sistema

---

## 🔑 Usuarios demo (listos para usar)

La primera vez que arrancas, el sistema crea automáticamente estos usuarios:

| Email                 | Contraseña | Rol                  |
|-----------------------|------------|----------------------|
| admin@robolab.com     | admin123   | Administrador        |
| jefe@robolab.com      | jefe123    | Jefe de Desarrollo   |
| ingeniero@robolab.com | inge123    | Ingeniero Electrónico|
| programador@robolab.com | dev123  | Programador          |
| disenador@robolab.com | dis123     | Diseñador CAD        |
| tecnico@robolab.com   | tec123     | Técnico              |
| contador@robolab.com  | cont123    | Contador             |
| cliente@robolab.com   | cli123     | Cliente              |

> 💡 **Tip:** En la pantalla de login, abajo, hay botones de **Acceso Rápido** para entrar con cada rol sin escribir credenciales.

---

## ✅ ¿Qué puedo hacer ya?

| Módulo                | Funcionalidad real implementada                                      |
|-----------------------|----------------------------------------------------------------------|
| 🔐 **Auth**           | Login, Registro, Recuperar contraseña, JWT, Permisos por rol         |
| 👥 **Usuarios**       | CRUD completo + búsqueda + filtro por estado/rol                     |
| 👷 **Equipo / Devs**  | Perfiles, disponibilidad, rendimiento, especialidades                |
| 👥 **Clientes**       | Listado, búsqueda, crear/editar/eliminar                             |
| 🧪 **Laboratorios**   | Listado, gestión, crear/editar, asignación de responsable            |
| 📋 **Proyectos**      | Listado, búsqueda, filtros, estados, progreso, detalle con tareas    |
| ✅ **Tareas**         | Kanban drag&drop, listado, cambio de estado, asignaciones            |
| 📅 **Calendario**     | Eventos, asignación, recordatorios                                   |
| 💬 **Chat**           | Mensajería entre usuarios, conversaciones                            |
| 📦 **Inventario**     | Stock, entradas/salidas, alertas bajo stock, categorías              |
| 💰 **Finanzas**       | Ingresos/gastos, resumen mensual, KPIs                               |
| 🧾 **Facturas**       | Emitir, listar, marcar como pagada, descargar PDF                    |
| 💵 **Pagos**          | Registrar pagos, asociar a facturas, métodos de pago                 |
| 📄 **Cotizaciones**   | Crear, aprobar/rechazar, convertir a proyecto                        |
| 📊 **Reportes**       | Generar reportes Excel/PDF personalizados                            |
| 🤖 **Asistente IA**   | Chat con IA integrado (configura tu API key en `.env`)               |
| 🎨 **Tema**           | Modo oscuro/claro, colores personalizables                           |

---

## 📁 Estructura del proyecto

```
RoboLabERP/
├── backend/                     # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/routes/          # auth, users, projects, inventory, financial, chat, dashboard
│   │   ├── models/__init__.py   # 19 modelos de datos
│   │   ├── schemas/__init__.py  # Validaciones Pydantic
│   │   ├── services/__init__.py # (lógica de negocio en servicios)
│   │   ├── core/                # config, database, security, pdf, excel, qr
│   │   └── main.py              # Entrypoint + seed automático
│   ├── uploads/                 # Archivos subidos (se crea auto)
│   ├── requirements.txt
│   └── .env                     # Configuración
│
└── frontend/                    # React 18 + Vite + Tailwind
    ├── src/
    │   ├── pages/               # 22 páginas (Dashboard, Projects, Kanban...)
    │   ├── components/          # Sidebar, AIAssistant, UI components
    │   ├── layouts/             # AppLayout, AuthLayout
    │   ├── context/             # AuthContext, AppDataContext, ThemeContext
    │   └── lib/                 # api.js (todos los endpoints), utils.js
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 📦 Despliegue en Vercel

Tienes una guía detallada paso a paso en el archivo [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md) para subir backend y frontend a Vercel y usar Vercel Postgres en producción.

---

## 🐛 Problemas comunes

| Problema                                   | Solución                                                                 |
|--------------------------------------------|--------------------------------------------------------------------------|
| `El término 'python' no se reconoce`       | Instala Python 3.11+ y marca "Add to PATH" en el instalador. Usa `py` como alternativa. |
| `El término 'npm' no se reconoce`          | Instala Node.js 18+ y reinicia terminal.                                 |
| Puerto 8000/5173 ocupado                   | Cierra el programa que lo use, o cambia los puertos en `vite.config.js` / comando uvicorn. |
| Base de datos vacía sin datos demo         | La primera carga del backend hace el seed. Revisa la consola del backend.|
| No puedo acceder desde otra PC             | El backend arranca con `--host 0.0.0.0` — accede con `http://<TU-IP>:8000`|

---

## 🛠️ Scripts útiles

```bash
npm run dev              # Backend + Frontend a la vez (modo desarrollo)
npm run dev:backend      # Solo el backend
npm run dev:frontend     # Solo el frontend
npm run build:frontend   # Compilar frontend para producción (./frontend/dist)
npm run start:backend    # Backend en modo producción
```

¡Listo para usar! 🎉
