from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import json
import os
import random
from jose import JWTError, jwt
from ...core.database import get_db
from ...core.security import get_current_user, require_roles
from ...core.config import settings
from ...models import Message, Notification, CalendarEvent, Lab, ActivityLog, User
from ...schemas import Message as MessageSchema, MessageCreate, Notification as NotifSchema, CalendarEvent as EventSchema, CalendarEventCreate, Lab as LabSchema, LabCreate

router = APIRouter(tags=["Chat, Calendar, Notifications, Labs & AI"])


# ===== LABS =====
@router.get("/labs", response_model=List[LabSchema])
def list_labs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Lab).all()


@router.post("/labs", response_model=LabSchema)
def create_lab(data: LabCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles("administrador"))):
    lab = Lab(**data.model_dump())
    db.add(lab)
    db.commit()
    db.refresh(lab)
    return lab


@router.put("/labs/{lab_id}", response_model=LabSchema)
def update_lab(lab_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(require_roles("administrador"))):
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(404, "Lab not found")
    for k, v in data.items():
        if hasattr(lab, k):
            setattr(lab, k, v)
    db.commit()
    db.refresh(lab)
    return lab


# ===== MESSAGES / CHAT =====
@router.get("/messages/{other_user_id}", response_model=List[MessageSchema])
def get_conversation(
    other_user_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msgs = db.query(Message).filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == other_user_id)) |
        ((Message.sender_id == other_user_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.created_at.desc()).limit(limit).all()
    return list(reversed(msgs))


@router.post("/messages", response_model=MessageSchema)
def send_message(
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data.sender_id = current_user.id
    msg = Message(**data.model_dump())
    db.add(msg)
    notif = Notification(user_id=data.receiver_id, title="Nuevo mensaje", message=msg.content[:100], type="chat", related_type="message")
    db.add(notif)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/conversations")
def get_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subq = db.query(
        Message.sender_id.label("other_id"), Message.created_at, Message.content
    ).filter(Message.receiver_id == current_user.id).union(
        db.query(Message.receiver_id.label("other_id"), Message.created_at, Message.content
    ).filter(Message.sender_id == current_user.id)).subquery()

    from sqlalchemy import func, desc
    rows = db.query(
        subq.c.other_id,
        func.max(subq.c.created_at).label("last_time"),
    ).group_by(subq.c.other_id).order_by(desc("last_time")).all()

    result = []
    for row in rows:
        u = db.query(User).filter(User.id == row.other_id).first()
        if u:
            last_msg = db.query(Message).filter(
                ((Message.sender_id == current_user.id) & (Message.receiver_id == row.other_id)) |
                ((Message.sender_id == row.other_id) & (Message.receiver_id == current_user.id))
            ).order_by(Message.created_at.desc()).first()
            unread = db.query(Message).filter(
                Message.sender_id == row.other_id, Message.receiver_id == current_user.id, Message.is_read == False
            ).count()
            result.append({
                "user_id": u.id,
                "full_name": u.full_name,
                "email": u.email,
                "avatar": u.avatar_url,
                "last_message": last_msg.content if last_msg else "",
                "last_time": row.last_time.isoformat() if row.last_time else None,
                "unread_count": unread,
            })
    return result


# ===== NOTIFICATIONS =====
@router.get("/notifications", response_model=List[NotifSchema])
def get_notifications(
    only_unread: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Notification).filter(Notification.user_id == current_user.id)
    if only_unread:
        q = q.filter(Notification.is_read == False)
    return q.order_by(Notification.created_at.desc()).limit(limit).all()


@router.post("/notifications/{notif_id}/read")
def mark_notif_read(notif_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    n = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not n:
        raise HTTPException(404, "Not found")
    n.is_read = True
    db.commit()
    return {"message": "Marked as read"}


@router.post("/notifications/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).update({Notification.is_read: True})
    db.commit()
    return {"message": "All marked as read"}


@router.post("/notifications", response_model=NotifSchema)
def create_notification(
    user_id: int, title: str, message: str = "", type: str = "info",
    db: Session = Depends(get_db), current_user: User = Depends(require_roles("administrador", "jefe_desarrollo")),
):
    n = Notification(user_id=user_id, title=title, message=message, type=type)
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


# ===== CALENDAR =====
@router.get("/calendar", response_model=List[EventSchema])
def list_calendar_events(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(CalendarEvent)
    if start_date:
        q = q.filter(CalendarEvent.start_datetime >= start_date)
    if end_date:
        q = q.filter(CalendarEvent.end_datetime <= end_date)
    return q.order_by(CalendarEvent.start_datetime).all()


@router.post("/calendar", response_model=EventSchema)
def create_calendar_event(
    data: CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not data.user_id:
        data.user_id = current_user.id
    ev = CalendarEvent(**data.model_dump())
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@router.delete("/calendar/{event_id}")
def delete_calendar_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ev = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not ev:
        raise HTTPException(404, "Event not found")
    db.delete(ev)
    db.commit()
    return {"message": "Event deleted"}


# AI routes moved to ai.py


# ===== ACTIVITY LOG =====
@router.get("/activity-log")
def get_activity_log(
    limit: int = 50,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador")),
):
    q = db.query(ActivityLog)
    if user_id:
        q = q.filter(ActivityLog.user_id == user_id)
    logs = q.order_by(ActivityLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "action": l.action,
            "user_id": l.user_id,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details,
            "ip_address": l.ip_address,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        } for l in logs
    ]


# ===== WEBSOCKET for real-time =====
def _extract_ws_token(websocket: WebSocket) -> Optional[str]:
    token = websocket.query_params.get("token")
    if token:
        return token
    auth_header = websocket.headers.get("authorization") or websocket.headers.get("Authorization")
    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]
    return None


def _decode_ws_user_id(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            return None
        return int(sub)
    except (JWTError, ValueError, TypeError):
        return None


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

    async def broadcast(self, message: dict):
        for conn in self.active_connections.values():
            await conn.send_json(message)

manager = ConnectionManager()


@router.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    token = _extract_ws_token(websocket)
    if not token:
        await websocket.close(code=4001, reason="Missing auth token")
        return

    real_user_id = _decode_ws_user_id(token)
    if not real_user_id:
        await websocket.close(code=4001, reason="Invalid or expired token")
        return

    user = db.query(User).filter(User.id == real_user_id).first()
    if not user or not user.is_active:
        await websocket.close(code=4001, reason="Invalid user")
        return

    actual_user_id = user.id
    await manager.connect(actual_user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "message":
                msg_data = MessageCreate(
                    sender_id=actual_user_id,
                    receiver_id=data.get("receiver_id"),
                    content=data.get("content", ""),
                    message_type=data.get("message_type", "text"),
                )
                msg = Message(**msg_data.model_dump())
                db.add(msg)
                db.commit()
                db.refresh(msg)
                notif = Notification(user_id=data.get("receiver_id"), title="Nuevo mensaje", message=msg.content[:100], type="chat", related_type="message")
                db.add(notif)
                db.commit()
                await manager.send_personal_message(
                    data.get("receiver_id"),
                    {"type": "new_message", "data": {"id": msg.id, "sender_id": actual_user_id, "content": msg.content, "created_at": msg.created_at.isoformat() if msg.created_at else None}}
                )
    except WebSocketDisconnect:
        manager.disconnect(actual_user_id)
    except Exception:
        manager.disconnect(actual_user_id)
        try:
            await websocket.close(code=4001)
        except Exception:
            pass
