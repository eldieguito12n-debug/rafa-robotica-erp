from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from ..models import ActivityLog


def log_activity(
    db: Session,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    details_json: Optional[Dict[str, Any]] = None,
) -> ActivityLog:
    log = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details_json or {},
    )
    db.add(log)
    db.flush()
    return log
