from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ...core.database import get_db
from ...core.security import get_current_user, require_roles
from ...core.activity_middleware import log_activity
from ...models import Client, User
from ...schemas import Client as ClientSchema, ClientCreate, ClientUpdate

router = APIRouter(tags=["Clients"])


@router.get("/clients", response_model=List[ClientSchema])
def list_clients(
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Client)
    if status:
        q = q.filter(Client.status == status)
    if search:
        srch = f"%{search}%"
        q = q.filter(
            (Client.company_name.ilike(srch)) |
            (Client.contact_person.ilike(srch)) |
            (Client.email.ilike(srch)) |
            (Client.phone.ilike(srch))
        )
    return q.order_by(Client.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/clients", response_model=ClientSchema)
def create_client(
    data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador", "jefe_desarrollo", "contador")),
):
    client = Client(**data.model_dump())
    db.add(client)
    db.flush()
    log_activity(db, current_user.id, "crear", "client", client.id, data.model_dump(mode='json'))
    db.commit()
    db.refresh(client)
    return client


@router.get("/clients/{client_id}", response_model=ClientSchema)
def get_client(client_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Client).filter(Client.id == client_id).first()
    if not c:
        raise HTTPException(404, "Client not found")
    return c


@router.put("/clients/{client_id}", response_model=ClientSchema)
def update_client(
    client_id: int,
    data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    c = db.query(Client).filter(Client.id == client_id).first()
    if not c:
        raise HTTPException(404, "Client not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.flush()
    log_activity(db, current_user.id, "actualizar", "client", c.id, data.model_dump(mode='json', exclude_unset=True))
    db.commit()
    db.refresh(c)
    return c


@router.delete("/clients/{client_id}")
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador")),
):
    c = db.query(Client).filter(Client.id == client_id).first()
    if not c:
        raise HTTPException(404, "Client not found")
    log_activity(db, current_user.id, "eliminar", "client", c.id, {"company_name": getattr(c, "company_name", None)})
    db.delete(c)
    db.commit()
    return {"message": "Client deleted"}
