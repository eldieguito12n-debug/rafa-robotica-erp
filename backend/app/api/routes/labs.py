from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ...core.database import get_db
from ...core.security import get_current_user, require_roles, require_admin
from ...core.activity_middleware import log_activity
from ...models import Lab, User
from ...schemas import Lab as LabSchema, LabCreate, LabUpdate

router = APIRouter(tags=["Labs"])

@router.get("/fix_db")
def fix_db(db: Session = Depends(get_db)):
    from sqlalchemy import text
    try:
        db.execute(text("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text;"))
        db.commit()
    except Exception as e:
        db.rollback()
        print("users.role error:", e)
        
    try:
        db.execute(text("ALTER TABLE developers ALTER COLUMN availability TYPE VARCHAR(50) USING availability::text;"))
        db.execute(text("ALTER TABLE developers ALTER COLUMN status TYPE VARCHAR(50) USING status::text;"))
        db.commit()
    except Exception as e:
        db.rollback()
        print("developers errors:", e)
        
    try:
        db.execute(text("ALTER TABLE projects ALTER COLUMN status TYPE VARCHAR(50) USING status::text;"))
        db.commit()
    except Exception as e:
        db.rollback()
        print("projects error:", e)
        
    try:
        db.execute(text("ALTER TABLE tasks ALTER COLUMN status TYPE VARCHAR(50) USING status::text;"))
        db.execute(text("ALTER TABLE tasks ALTER COLUMN priority TYPE VARCHAR(50) USING priority::text;"))
        db.commit()
    except Exception as e:
        db.rollback()
        print("tasks error:", e)

    return {"message": "Enums removed, converted to VARCHAR"}


@router.get("/labs", response_model=List[LabSchema])
def list_labs(
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    q = db.query(Lab)
    if status:
        q = q.filter(Lab.status == status)
    if search:
        srch = f"%{search}%"
        q = q.filter(
            (Lab.name.ilike(srch)) |
            (Lab.location.ilike(srch)) |
            (Lab.description.ilike(srch))
        )
    return q.order_by(Lab.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/labs", response_model=LabSchema)
def create_lab(
    data: LabCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    lab = Lab(**data.model_dump())
    db.add(lab)
    db.flush()
    log_activity(db, current_user.id, "crear", "lab", lab.id, data.model_dump(mode='json'))
    db.commit()
    db.refresh(lab)
    return lab


@router.get("/labs/{lab_id}", response_model=LabSchema)
def get_lab(lab_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    l = db.query(Lab).filter(Lab.id == lab_id).first()
    if not l:
        raise HTTPException(404, "Lab not found")
    return l


@router.put("/labs/{lab_id}", response_model=LabSchema)
def update_lab(
    lab_id: int,
    data: LabUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    l = db.query(Lab).filter(Lab.id == lab_id).first()
    if not l:
        raise HTTPException(404, "Lab not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(l, k, v)
    db.flush()
    log_activity(db, current_user.id, "actualizar", "lab", l.id, data.model_dump(mode='json', exclude_unset=True))
    db.commit()
    db.refresh(l)
    return l


@router.delete("/labs/{lab_id}")
def delete_lab(
    lab_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    l = db.query(Lab).filter(Lab.id == lab_id).first()
    if not l:
        raise HTTPException(404, "Lab not found")
    log_activity(db, current_user.id, "eliminar", "lab", l.id, {"name": l.name})
    db.delete(l)
    db.commit()
    return {"message": "Lab deleted"}
