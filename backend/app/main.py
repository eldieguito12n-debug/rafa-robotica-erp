from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from .core.config import settings
from .core.database import engine, Base
from .api import api_router
from .models import *

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RoboLab ERP API",
    description="Sistema Inteligente para Laboratorio de Robótica e Innovación Tecnológica",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS if isinstance(settings.BACKEND_CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
except Exception:
    pass


@app.get("/", tags=["Root"])
def root():
    return {
        "name": "RoboLab ERP API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "api": settings.API_V1_STR,
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "timestamp": __import__("datetime").datetime.utcnow().isoformat()}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}", "type": type(exc).__name__},
    )


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
async def startup_event():
    from .core.database import SessionLocal
    from .core.security import get_password_hash
    db = SessionLocal()
    try:
        from .models import User, UserRole, Lab, InventoryItem, InventoryCategory, Project, Task, Client, FinancialRecord, FinancialType, Developer
        from datetime import date

        if not db.query(User).filter(User.email == "admin@robolab.com").first():
            admin = User(
                email="admin@robolab.com",
                full_name="Administrador RoboLab",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                phone="+573000000000",
                is_active=True,
            )
            db.add(admin)
            db.flush()

            jefe = User(
                email="jefe@robolab.com",
                full_name="Jefe de Desarrollo",
                hashed_password=get_password_hash("jefe123"),
                role=UserRole.JEFE_DESARROLLO,
                is_active=True,
            )
            db.add(jefe)
            db.flush()

            dev1 = User(email="dev@robolab.com", full_name="Programador Senior", hashed_password=get_password_hash("dev123"), role=UserRole.PROGRAMADOR, is_active=True)
            dev2 = User(email="ing@robolab.com", full_name="Ingeniero Electrónico", hashed_password=get_password_hash("ing123"), role=UserRole.INGENIERO_ELECTRONICO, is_active=True)
            dev3 = User(email="cad@robolab.com", full_name="Diseñador CAD", hashed_password=get_password_hash("cad123"), role=UserRole.DISENADOR_CAD, is_active=True)
            tec = User(email="tecnico@robolab.com", full_name="Técnico de Laboratorio", hashed_password=get_password_hash("tec123"), role=UserRole.TECNICO, is_active=True)
            cont = User(email="contador@robolab.com", full_name="Contador Financiero", hashed_password=get_password_hash("cont123"), role=UserRole.CONTADOR, is_active=True)
            cli = User(email="cliente@robolab.com", full_name="Cliente Demo", hashed_password=get_password_hash("cli123"), role=UserRole.CLIENTE, is_active=True)
            for u in [dev1, dev2, dev3, tec, cont, cli]:
                db.add(u)
            db.flush()

            for user, pos, spec in [
                (admin, "Gerente General", "Gestión estratégica"),
                (jefe, "Jefe de Desarrollo", "Gestión de proyectos"),
                (dev1, "Programador Senior", "Python / React / ROS"),
                (dev2, "Ingeniero Electrónico", "Diseño de PCB / IoT"),
                (dev3, "Diseñador CAD", "SolidWorks / Fusion 360"),
                (tec, "Técnico de Laboratorio", "Mantenimiento / Calibración"),
            ]:
                d = Developer(user_id=user.id, position=pos, specialty=spec, hours_worked=120, performance_score=85, compliance_percentage=92)
                db.add(d)

            client1 = Client(user_id=cli.id, company_name="TechCorp Solutions", nit="900123456-7", address="Calle 100 #20-30, Bogotá", contact_name="Cliente Demo", credit_limit=50000000, current_balance=0)
            db.add(client1)
            db.flush()

            labs_data = [
                ("Laboratorio IoT", "LAB-IOT-01", "Edificio A - Piso 1", "operativo"),
                ("Laboratorio de Electrónica", "LAB-ELEC-01", "Edificio A - Piso 2", "operativo"),
                ("Laboratorio de Robótica", "LAB-ROB-01", "Edificio B - Piso 1", "operativo"),
                ("Laboratorio CAD 3D", "LAB-CAD-01", "Edificio B - Piso 2", "mantenimiento"),
                ("Taller de Impresión 3D", "LAB-3D-01", "Edificio C", "disponible"),
            ]
            for name, code, loc, st in labs_data:
                db.add(Lab(name=name, code=code, location=loc, description=f"{name} equipado con tecnología de última generación.", status=st, capacity=15))

            items = [
                ("Arduino Uno R3", InventoryCategory.ARDUINO, "ARD-UNO-001", 50, 10, 45000, "Arduino Store"),
                ("ESP32 DevKit V1", InventoryCategory.ESP32, "ESP-32-001", 35, 8, 75000, "Espressif"),
                ("Servomotor SG90", InventoryCategory.SERVOMOTORES, "SRV-SG90-001", 80, 20, 12000, "TowerPro"),
                ("Sensor Ultrasónico HC-SR04", InventoryCategory.SENSORES, "SNS-ULT-001", 3, 10, 18000, "Generic"),
                ("Motor DC 6V", InventoryCategory.MOTORES, "MTR-DC-001", 25, 10, 25000, "Generic"),
                ("Batería LiPo 11.1V", InventoryCategory.BATERIAS, "BAT-LIPO-001", 8, 5, 95000, "Tattu"),
                ("Raspberry Pi Camera V2", InventoryCategory.CAMARAS, "CAM-RPI-001", 12, 3, 120000, "Raspberry"),
                ("Filamento PLA 1kg", InventoryCategory.IMPRESIONES_3D, "FIL-PLA-001", 3, 15, 85000, "Prusa"),
                ("Soldador Estaño 60W", InventoryCategory.HERRAMIENTAS, "HERR-SOL-001", 5, 2, 120000, "Weller"),
                ("Resistencias 1/4W Mix", InventoryCategory.CONSUMIBLES, "CONS-RES-001", 500, 100, 50000, "Generic"),
            ]
            for n, c, sku, qty, ms, cost, sup in items:
                low = qty <= ms
                db.add(InventoryItem(name=n, category=c, description=f"{n} de alta calidad", sku=sku, quantity=qty, min_stock=ms, unit_cost=cost, supplier=sup, low_stock_alert=low))

            db.flush()

            p1 = Project(name="Robot Autónomo de Entrega", client_id=client1.id, description="Desarrollo de robot autónomo para entregas urbanas con navegación GPS", budget_value=25000000, start_date=date.today(), end_date=date(date.today().year + 1, date.today().month, 1), status="en_progreso", progress_percentage=45, created_by_id=admin.id, lab_id=1)
            p2 = Project(name="Sistema IoT de Monitoreo Agrícola", client_id=client1.id, description="Sensores IoT para monitoreo de cultivos con dashboard en tiempo real", budget_value=15000000, start_date=date.today(), status="pendiente", progress_percentage=10, created_by_id=admin.id, lab_id=1)
            p3 = Project(name="Brazo Robótico Industrial 6DOF", description="Brazo robótico de 6 ejes para línea de ensamblaje automatizada", budget_value=45000000, start_date=date(2024, 1, 15), end_date=date(2024, 12, 15), status="finalizado", progress_percentage=100, actual_cost=42000000, created_by_id=admin.id, lab_id=2)
            for p in [p1, p2, p3]:
                db.add(p)

            db.flush()

            from datetime import timedelta
            today = date.today()
            tasks = [
                ("Diseñar chasis del robot", p1.id, dev3.id, admin.id, "alta", "en_proceso", 70, today + timedelta(days=3)),
                ("Integrar sensor LIDAR", p1.id, dev2.id, jefe.id, "urgente", "pendiente", 0, today + timedelta(days=5)),
                ("Desarrollar algoritmo de navegación", p1.id, dev1.id, jefe.id, "alta", "en_proceso", 40, today + timedelta(days=10)),
                ("Diseñar PCB controladora", p1.id, dev2.id, jefe.id, "media", "pendiente", 0, today + timedelta(days=7)),
                ("Configurar sensores de humedad", p2.id, dev2.id, jefe.id, "media", "pendiente", 0, None),
                ("Crear dashboard web", p2.id, dev1.id, jefe.id, "alta", "en_proceso", 50, today + timedelta(days=6)),
                ("Calibración final de ejes", p3.id, tec.id, jefe.id, "baja", "finalizado", 100, None),
                ("Documentación técnica", p3.id, dev3.id, jefe.id, "media", "finalizado", 100, None),
            ]
            for t in tasks:
                db.add(Task(title=t[0], project_id=t[1], assigned_to_id=t[2], created_by_id=t[3], priority=t[4], status=t[5], progress_percentage=t[6], due_date=t[7], estimated_hours=16))

            fin_data = [
                (FinancialType.VENTA, "Factura #001 - Proyecto Brazo Robótico", 45000000, date(2024, 12, 10), "Ventas Proyectos", "Transferencia Bancaria"),
                (FinancialType.INGRESO, "Abono Cliente - Robot Entrega", 12500000, today - timedelta(days=28), "Abonos Proyectos", "PSE"),
                (FinancialType.COMPRA, "Compra de componentes electrónicos", 5500000, today - timedelta(days=25), "Insumos Electrónica", "Crédito"),
                (FinancialType.EGRESO, "Nómina del mes", 28000000, today - timedelta(days=15), "Nómina", "Transferencia"),
                (FinancialType.EGRESO, "Mantenimiento equipos laboratorio", 3500000, today - timedelta(days=20), "Mantenimiento", "Efectivo"),
                (FinancialType.VENTA, "Cotización #007 - Cliente TechCorp", 8500000, today - timedelta(days=12), "Cotizaciones Aprobadas", "Transferencia"),
            ]
            for t, desc, amt, d, cat, pm in fin_data:
                db.add(FinancialRecord(type=t, description=desc, amount=amt, date=d, category=cat, payment_method=pm))

            db.commit()
    except Exception as e:
        db.rollback()
        print(f"Seed data error (may already exist): {e}")
    finally:
        db.close()
