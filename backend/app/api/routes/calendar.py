from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date as date_type
from ...core.database import get_db
from ...core.security import get_current_user, require_roles
from ...models import CalendarEvent, User
from ...schemas import CalendarEvent as CalendarEventSchema, CalendarEventCreate, CalendarEventUpdate

router = APIRouter(tags=["Calendar"])


@router.get("/calendar", response_model=List[CalendarEventSchema])
def list_events(
    date_from: Optional[date_type] = None,
    date_to: Optional[date_type] = None,
    project_id: Optional[int] = None,
    assigned_to_id: Optional[int] = None,
    created_by_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(CalendarEvent)
    if date_from:
        q = q.filter(CalendarEvent.date >= date_from)
    if date_to:
        q = q.filter(CalendarEvent.date <= date_to)
    if project_id:
        q = q.filter(CalendarEvent.project_id == project_id)
    if assigned_to_id:
        # assigned_to_ids es JSON/array; usamos LIKE ya que se guarda como texto en SQLite
        q = q.filter(CalendarEvent.assigned_to_ids.ilike(f"%{assigned_to_id}%"))
    if created_by_id:
        q = q.filter(CalendarEvent.created_by_id == created_by_id)
    return q.order_by(CalendarEvent.date, CalendarEvent.start_time).all()


@router.post("/calendar", response_model=CalendarEventSchema)
def create_event(
    data: CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ev = CalendarEvent(**data.model_dump())
    ev.created_by_id = current_user.id
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@router.get("/calendar/{event_id}", response_model=CalendarEventSchema)
def get_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ev = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not ev:
        raise HTTPException(404, "Event not found")
    return ev


@router.put("/calendar/{event_id}", response_model=CalendarEventSchema)
def update_event(
    event_id: int,
    data: CalendarEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ev = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not ev:
        raise HTTPException(404, "Event not found")
    # Solo el creador o admin pueden editar
    if ev.created_by_id != current_user.id and current_user.role not in ("administrador", "jefe_desarrollo"):
        raise HTTPException(403, "No permission to edit this event")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(ev, k, v)
    db.commit()
    db.refresh(ev)
    return ev


@router.delete("/calendar/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ev = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not ev:
        raise HTTPException(404, "Event not found")
    if ev.created_by_id != current_user.id and current_user.role not in ("administrador", "jefe_desarrollo"):
        raise HTTPException(403, "No permission to delete this event")
    db.delete(ev)
    db.commit()
    return {"message": "Event deleted"}
