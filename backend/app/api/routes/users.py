from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ...core.database import get_db
from ...core.security import get_current_user, require_roles, require_admin, ADMIN_ROLES
from ...core.activity_middleware import log_activity
from ...models import User, Developer, Client
from ...schemas import User as UserSchema, UserUpdate, DeveloperCreate, Developer as DeveloperSchema, ClientCreate, Client as ClientSchema

router = APIRouter(prefix="/users", tags=["Users & Developers"])


@router.get("", response_model=List[UserSchema])
def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Solo Administrador / Jefe de Desarrollo pueden ver todos los usuarios."""
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    if search:
        q = q.filter((User.full_name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%")))
    return q.offset(skip).limit(limit).all()


@router.get("/roles", tags=["Users & Developers"])
def list_roles(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """Retorna los roles únicos registrados en la DB + roles base del sistema."""
    base_roles = list(ADMIN_ROLES) + ["programador", "ingeniero_electronico", "disenador_cad", "tecnico", "contador", "cliente"]
    db_roles = [r[0] for r in db.query(User.role).distinct().all() if r[0]]
    all_roles = sorted(set(base_roles + db_roles))
    return {"roles": all_roles}


@router.get("/{user_id}", response_model=UserSchema)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.put("/{user_id}", response_model=UserSchema)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.flush()
    log_activity(db, current_user.id, "actualizar", "user", user.id, data.model_dump(mode='json', exclude_unset=True))
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta")
    
    # Guardamos logs antes de borrar
    log_activity(db, current_user.id, "eliminar", "user", user.id, {"email": user.email, "full_name": user.full_name})
    
    # Manejar dependencias para evitar IntegrityError
    from ...models import Developer, Client, Task, Project, Message, Notification, ActivityLog, FinancialRecord, InventoryMovement, ProjectDeveloper, CalendarEvent, Invoice, Quote, Payment
    
    # 1. Nullify FKs on User
    db.query(Task).filter(Task.assigned_to_id == user.id).update({Task.assigned_to_id: None}, synchronize_session=False)
    db.query(Task).filter(Task.created_by_id == user.id).update({Task.created_by_id: None}, synchronize_session=False)
    db.query(Project).filter(Project.created_by_id == user.id).update({Project.created_by_id: None}, synchronize_session=False)
    db.query(FinancialRecord).filter(FinancialRecord.user_id == user.id).update({FinancialRecord.user_id: None}, synchronize_session=False)
    db.query(InventoryMovement).filter(InventoryMovement.user_id == user.id).update({InventoryMovement.user_id: None}, synchronize_session=False)
    db.query(CalendarEvent).filter(CalendarEvent.user_id == user.id).delete(synchronize_session=False)
    
    # 2. Delete Developer and associated ProjectDeveloper
    dev = db.query(Developer).filter(Developer.user_id == user.id).first()
    if dev:
        db.query(ProjectDeveloper).filter(ProjectDeveloper.developer_id == dev.id).delete(synchronize_session=False)
        db.delete(dev)
        
    # 3. Handle Client and its dependencies
    client_record = db.query(Client).filter(Client.user_id == user.id).first()
    if client_record:
        db.query(Project).filter(Project.client_id == client_record.id).update({Project.client_id: None}, synchronize_session=False)
        db.query(Invoice).filter(Invoice.client_id == client_record.id).update({Invoice.client_id: None}, synchronize_session=False)
        db.query(Quote).filter(Quote.client_id == client_record.id).update({Quote.client_id: None}, synchronize_session=False)
        db.query(Payment).filter(Payment.client_id == client_record.id).update({Payment.client_id: None}, synchronize_session=False)
        db.delete(client_record)
    
    # 4. Delete Messages, Notifications, ActivityLogs
    db.query(Message).filter((Message.sender_id == user.id) | (Message.receiver_id == user.id)).delete(synchronize_session=False)
    db.query(Notification).filter(Notification.user_id == user.id).delete(synchronize_session=False)
    db.query(ActivityLog).filter(ActivityLog.user_id == user.id).delete(synchronize_session=False)
    
    db.flush()
    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado"}


# ─── Developers ───────────────────────────────────────────────────────────────

@router.get("/developers/all", response_model=List[DeveloperSchema])
def list_developers(
    search: Optional[str] = None,
    availability: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    q = db.query(Developer)
    if availability:
        q = q.filter(Developer.availability == availability)
    return q.all()


@router.post("/developers", response_model=DeveloperSchema)
def create_developer(
    data: DeveloperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    dev = Developer(**data.model_dump())
    db.add(dev)
    db.flush()
    log_activity(db, current_user.id, "crear", "developer", dev.id, data.model_dump(mode='json'))
    db.commit()
    db.refresh(dev)
    return dev


@router.get("/developers/{dev_id}", response_model=DeveloperSchema)
def get_developer(dev_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    dev = db.query(Developer).filter(Developer.id == dev_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Desarrollador no encontrado")
    return dev


@router.put("/developers/{dev_id}", response_model=DeveloperSchema)
def update_developer(dev_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    dev = db.query(Developer).filter(Developer.id == dev_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Desarrollador no encontrado")
    for k, v in data.items():
        if hasattr(dev, k):
            setattr(dev, k, v)
    db.flush()
    log_activity(db, current_user.id, "actualizar", "developer", dev.id, data)
    db.commit()
    db.refresh(dev)
    return dev


# ─── Clients ──────────────────────────────────────────────────────────────────

@router.get("/clients/all", response_model=List[ClientSchema])
def list_clients(search: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    q = db.query(Client)
    if search:
        q = q.join(User).filter(User.full_name.ilike(f"%{search}%"))
    return q.all()


@router.post("/clients", response_model=ClientSchema)
def create_client(data: ClientCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    c = Client(**data.model_dump())
    db.add(c)
    db.flush()
    log_activity(db, current_user.id, "crear", "client", c.id, data.model_dump(mode='json'))
    db.commit()
    db.refresh(c)
    return c
