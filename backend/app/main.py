from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from .core.config import settings
from .core.database import engine, Base, get_db
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

@app.on_event("startup")
def run_migrations():
    from .core.database import SessionLocal
    from sqlalchemy import text
    db = SessionLocal()
    try:
        queries = [
            "ALTER TABLE tasks ADD COLUMN approved_by_id INTEGER REFERENCES users(id)",
            "ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE",
            "ALTER TABLE tasks ADD COLUMN total_time_spent FLOAT DEFAULT 0.0",
            "ALTER TABLE tasks ADD COLUMN history JSON DEFAULT '[]'",
            "ALTER TABLE inventory_movements ADD COLUMN user_name VARCHAR(255)",
            "ALTER TABLE inventory_movements ADD COLUMN user_role VARCHAR(100)",
            "ALTER TABLE inventory_movements ADD COLUMN project_id INTEGER REFERENCES projects(id)",
            "CREATE TABLE IF NOT EXISTS notifications (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, title VARCHAR(255) NOT NULL, message VARCHAR(1000), type VARCHAR(100), related_id INTEGER, related_type VARCHAR(100), is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)"
        ]
        for q in queries:
            try:
                db.execute(text(q))
                db.commit()
            except Exception as e:
                db.rollback()
    finally:
        db.close()

@app.get("/api/v1/migrate_db")
def migrate_db(db: Session = Depends(get_db)):
    from sqlalchemy import text
    results = []
    
    queries = [
        "ALTER TABLE tasks ADD COLUMN approved_by_id INTEGER REFERENCES users(id)",
        "ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE tasks ADD COLUMN total_time_spent FLOAT DEFAULT 0.0",
        "ALTER TABLE tasks ADD COLUMN history JSON DEFAULT '[]'::json",
        "ALTER TABLE inventory_movements ADD COLUMN user_name VARCHAR(255)",
        "ALTER TABLE inventory_movements ADD COLUMN user_role VARCHAR(100)",
        "ALTER TABLE inventory_movements ADD COLUMN project_id INTEGER REFERENCES projects(id)",
        "CREATE TABLE IF NOT EXISTS notifications (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, title VARCHAR(255) NOT NULL, message VARCHAR(1000), type VARCHAR(100), related_id INTEGER, related_type VARCHAR(100), is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)"
    ]
    
    for q in queries:
        try:
            db.execute(text(q))
            db.commit()
            results.append(f"SUCCESS: {q}")
        except Exception as e:
            db.rollback()
            results.append(f"ERROR: {str(e)}")
            
    return {"results": results}

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS if isinstance(settings.BACKEND_CORS_ORIGINS, list) else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
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


from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO

@app.get("/public/quotes/{quote_id}/pdf", tags=["Public"])
def public_download_quote_pdf(quote_id: int, db: Session = Depends(get_db)):
    from .core.pdf import generate_quote_pdf_bytes
    q = db.query(Quote).filter(Quote.id == quote_id).first()
    if not q:
        raise HTTPException(404, "Quote not found")
    try:
        pdf_bytes = generate_quote_pdf_bytes(db, quote_id)
    except Exception as e:
        raise HTTPException(500, f"Error generating PDF: {str(e)}")
        
    filename = f"Cotizacion_{quote_id}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"},
    )


from sqlalchemy import text

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}





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
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"Seed data error (may already exist): {e}")
    finally:
        db.close()
