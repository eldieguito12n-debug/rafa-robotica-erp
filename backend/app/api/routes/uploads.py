import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from ...core.database import get_db
from ...core.security import get_current_user, require_roles
from ...core.config import settings
from ...models import User

router = APIRouter(tags=["Uploads"])

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".stl", ".step", ".iges", ".dxf", ".dwg", ".zip", ".txt", ".csv", ".json", ".kicad_pcb", ".sch", ".brd"}
MAX_SIZE = 20 * 1024 * 1024  # 20 MB


def _ensure_upload_dir(sub: Optional[str] = None):
    base = settings.UPLOAD_DIR or "./uploads"
    if sub:
        base = os.path.join(base, sub)
    os.makedirs(base, exist_ok=True)
    return base


def _safe_ext(filename: str) -> str:
    ext = os.path.splitext(filename or "")[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"Tipo de archivo no permitido: {ext}. Usa: {', '.join(sorted(ALLOWED_EXT))}")
    return ext


@router.post("/upload")
def upload_file(
    subfolder: Optional[str] = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if subfolder and (".." in subfolder or subfolder.startswith("/") or "\\" in subfolder):
        raise HTTPException(400, "Subfolder inválido")
    if file.size and file.size > MAX_SIZE:
        raise HTTPException(400, f"Archivo muy grande. Máximo {MAX_SIZE//(1024*1024)} MB")

    ext = _safe_ext(file.filename or "")
    directory = _ensure_upload_dir(subfolder)
    unique_name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(directory, unique_name)

    try:
        with open(path, "wb") as f:
            content = file.file.read()
            if len(content) > MAX_SIZE:
                raise HTTPException(400, f"Archivo muy grande. Máximo {MAX_SIZE//(1024*1024)} MB")
            f.write(content)
    except Exception as e:
        raise HTTPException(500, f"Error guardando archivo: {e}")

    relative = f"{subfolder + '/' if subfolder else ''}{unique_name}"
    return {
        "filename": file.filename,
        "stored": relative,
        "url": f"/uploads/{relative}",
        "size": os.path.getsize(path),
        "type": file.content_type,
    }


@router.get("/uploads/{file_path:path}")
def serve_file(file_path: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Descarga un archivo previamente subido."""
    if ".." in file_path:
        raise HTTPException(400, "Ruta inválida")
    base = settings.UPLOAD_DIR or "./uploads"
    full = os.path.normpath(os.path.join(base, file_path))
    if not os.path.isfile(full):
        raise HTTPException(404, "Archivo no encontrado")
    filename = os.path.basename(full)
    return FileResponse(full, filename=filename)


@router.delete("/uploads/{file_path:path}")
def delete_file(
    file_path: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador")),
):
    if ".." in file_path:
        raise HTTPException(400, "Ruta inválida")
    base = settings.UPLOAD_DIR or "./uploads"
    full = os.path.normpath(os.path.join(base, file_path))
    if not os.path.isfile(full):
        raise HTTPException(404, "Archivo no encontrado")
    os.remove(full)
    return {"message": "Archivo eliminado"}
