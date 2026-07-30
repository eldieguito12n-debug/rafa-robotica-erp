import os
import json
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from ...core.database import get_db
from ...core.security import get_current_user
from ...models import User, ActivityLog

router = APIRouter(prefix="/settings", tags=["Settings"])

SETTINGS_FILE = "settings.json"

class SystemSettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    app_name: Optional[str] = None
    notifications_enabled: Optional[bool] = None

def load_settings() -> Dict[str, Any]:
    if not os.path.exists(SETTINGS_FILE):
        return {
            "company_name": "RoboLab",
            "app_name": "RoboLab ERP",
            "notifications_enabled": True
        }
    with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_settings(settings: Dict[str, Any]):
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=4)

@router.get("/")
def get_settings(current_user: User = Depends(get_current_user)):
    return load_settings()

@router.put("/")
def update_settings(
    settings_in: SystemSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "administrador":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    current_settings = load_settings()
    
    if settings_in.company_name is not None:
        current_settings["company_name"] = settings_in.company_name
    if settings_in.app_name is not None:
        current_settings["app_name"] = settings_in.app_name
    if settings_in.notifications_enabled is not None:
        current_settings["notifications_enabled"] = settings_in.notifications_enabled
        
    save_settings(current_settings)
    
    # Log activity
    log = ActivityLog(
        user_id=current_user.id,
        action="update_settings",
        entity_type="system",
        details={"updated_keys": settings_in.dict(exclude_unset=True)}
    )
    db.add(log)
    db.commit()
    
    return current_settings

@router.get("/activity-logs")
def get_activity_logs(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "administrador":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    
    # Format with user info
    result = []
    for log in logs:
        user_info = {"id": log.user.id, "full_name": log.user.full_name} if log.user else None
        result.append({
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "user": user_info
        })
        
    return result
