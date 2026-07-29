from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ...core.database import get_db
from ...core.security import get_current_user, require_roles
from ...models import User, UserRole, Developer, Client
from ...schemas import User as UserSchema, UserUpdate, DeveloperCreate, Developer as DeveloperSchema, ClientCreate, Client as ClientSchema

router = APIRouter(prefix="/users", tags=["Users & Developers"])


@router.get("", response_model=List[UserSchema])
def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador", "jefe_desarrollo")),
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    if search:
        q = q.filter((User.full_name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%")))
    return q.offset(skip).limit(limit).all()


@router.get("/{user_id}", response_model=UserSchema)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserSchema)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    return {"message": "User deactivated"}


# Developers
@router.get("/developers/all", response_model=List[DeveloperSchema])
def list_developers(
    search: Optional[str] = None,
    availability: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Developer)
    if availability:
        q = q.filter(Developer.availability == availability)
    return q.all()


@router.post("/developers", response_model=DeveloperSchema)
def create_developer(
    data: DeveloperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador", "jefe_desarrollo")),
):
    dev = Developer(**data.model_dump())
    db.add(dev)
    db.commit()
    db.refresh(dev)
    return dev


@router.get("/developers/{dev_id}", response_model=DeveloperSchema)
def get_developer(dev_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    dev = db.query(Developer).filter(Developer.id == dev_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Developer not found")
    return dev


@router.put("/developers/{dev_id}", response_model=DeveloperSchema)
def update_developer(dev_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    dev = db.query(Developer).filter(Developer.id == dev_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Developer not found")
    for k, v in data.items():
        if hasattr(dev, k):
            setattr(dev, k, v)
    db.commit()
    db.refresh(dev)
    return dev


# Clients
@router.get("/clients/all", response_model=List[ClientSchema])
def list_clients(search: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Client)
    if search:
        q = q.join(User).filter(User.full_name.ilike(f"%{search}%"))
    return q.all()


@router.post("/clients", response_model=ClientSchema)
def create_client(data: ClientCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles("administrador", "contador"))):
    c = Client(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c
