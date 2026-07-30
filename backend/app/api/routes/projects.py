from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ...core.database import get_db
from ...core.security import get_current_user, require_roles, require_admin, is_admin
from ...core.activity_middleware import log_activity
from ...models import Project, Task, ProjectDeveloper, User, TaskPriority
from ...schemas import Project as ProjectSchema, ProjectCreate, ProjectUpdate, ProjectDeveloperCreate, Task as TaskSchema, TaskCreate, TaskUpdate

router = APIRouter(tags=["Projects & Tasks"])


def _recalc_project_progress(db: Session, project_id: int):
    """Regla de negocio 1: Recalcula progress_percentage del proyecto según sus tareas."""
    if not project_id:
        return
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return
    if not tasks:
        project.progress_percentage = 0
    else:
        avg = sum(t.progress_percentage or 0 for t in tasks) / len(tasks)
        project.progress_percentage = round(avg, 1)
        # Si TODAS las tareas están finalizadas → proyecto finalizado
        all_done = all((str(t.status) == "finalizado" or (hasattr(t.status, 'value') and t.status.value == "finalizado")) for t in tasks) and len(tasks) > 0
        if all_done and str(project.status) in ("planeacion", "en_progreso", "en_pruebas", "pendiente"):
            project.status = "finalizado"
    db.add(project)
    db.flush()


# ===== PROJECTS =====
@router.get("/projects", response_model=List[ProjectSchema])
def list_projects(
    status: Optional[str] = None,
    client_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Project)
    
    # Filter logic: if not admin, only show projects assigned to the user
    if not is_admin(current_user):
        if current_user.developer:
            q = q.join(ProjectDeveloper).filter(ProjectDeveloper.developer_id == current_user.developer.id)
        else:
            q = q.filter(Project.id == 0) # empty

    if status:
        q = q.filter(Project.status == status)
    if client_id:
        q = q.filter(Project.client_id == client_id)
    if search:
        q = q.filter(Project.name.ilike(f"%{search}%"))
    return q.order_by(Project.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/projects", response_model=ProjectSchema)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if not data.created_by_id:
        data.created_by_id = current_user.id
    p = Project(**data.model_dump())
    db.add(p)
    db.flush()
    log_activity(db, current_user.id, "crear", "project", p.id, data.model_dump(mode='json'))
    db.commit()
    db.refresh(p)
    return p


@router.get("/projects/{project_id}", response_model=ProjectSchema)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Project).filter(Project.id == project_id)
    if not is_admin(current_user):
        if current_user.developer:
            q = q.join(ProjectDeveloper).filter(ProjectDeveloper.developer_id == current_user.developer.id)
        else:
            q = q.filter(Project.id == 0)
    p = q.first()
    if not p:
        raise HTTPException(404, "Project not found")
    return p


@router.put("/projects/{project_id}", response_model=ProjectSchema)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(404, "Project not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.flush()
    log_activity(db, current_user.id, "actualizar", "project", p.id, data.model_dump(mode='json', exclude_unset=True))
    db.commit()
    db.refresh(p)
    return p


@router.delete("/projects/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(404, "Project not found")
    log_activity(db, current_user.id, "eliminar", "project", p.id, {"name": p.name})
    db.delete(p)
    db.commit()
    return {"message": "Project deleted"}


@router.get("/projects/{project_id}/developers")
def get_project_developers(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pd = db.query(ProjectDeveloper).filter(ProjectDeveloper.project_id == project_id).all()
    return [{"id": x.id, "developer_id": x.developer_id, "role": x.role_in_project, "hours": x.hours_allocated} for x in pd]


@router.post("/projects/{project_id}/developers")
def add_developer_to_project(
    project_id: int,
    data: ProjectDeveloperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    pd = ProjectDeveloper(**data.model_dump())
    pd.project_id = project_id
    db.add(pd)
    db.flush()
    log_activity(db, current_user.id, "crear", "project_developer", pd.id, {"project_id": project_id, **data.model_dump(mode='json')})
    db.commit()
    return {"message": "Developer added"}


@router.get("/projects/{project_id}/kanban")
def get_project_kanban(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    columns = {
        "pendiente": [],
        "en_proceso": [],
        "en_pruebas": [],
        "finalizado": [],
        "cancelado": [],
    }
    for t in tasks:
        status_key = t.status.value if hasattr(t.status, 'value') else str(t.status)
        if status_key in columns:
            columns[status_key].append({
                "id": t.id,
                "title": t.title,
                "priority": t.priority.value if hasattr(t.priority, 'value') else str(t.priority),
                "progress": t.progress_percentage,
                "due_date": str(t.due_date) if t.due_date else None,
                "assigned_to_id": t.assigned_to_id,
            })
    return columns


# ===== TASKS =====
@router.get("/tasks", response_model=List[TaskSchema])
def list_tasks(
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    assigned_to_id: Optional[int] = None,
    priority: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Task)
    
    # Filter logic: if not admin, only show assigned tasks
    if not is_admin(current_user):
        q = q.filter(Task.assigned_to_id == current_user.id)

    if status:
        q = q.filter(Task.status == status)
    if project_id:
        q = q.filter(Task.project_id == project_id)
    if assigned_to_id:
        q = q.filter(Task.assigned_to_id == assigned_to_id)
    if priority:
        q = q.filter(Task.priority == priority)
    return q.order_by(Task.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/tasks", response_model=TaskSchema)
def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    t = Task(**data.model_dump())
    t.created_by_id = current_user.id
    db.add(t)
    db.flush()
    log_activity(db, current_user.id, "crear", "task", t.id, data.model_dump(mode='json'))
    _recalc_project_progress(db, t.project_id)
    db.commit()
    db.refresh(t)
    return t


@router.get("/tasks/{task_id}", response_model=TaskSchema)
def get_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Task).filter(Task.id == task_id)
    if not is_admin(current_user):
        q = q.filter(Task.assigned_to_id == current_user.id)
    t = q.first()
    if not t:
        raise HTTPException(404, "Task not found")
    return t


@router.put("/tasks/{task_id}", response_model=TaskSchema)
def update_task(
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(404, "Task not found")

    if "status" in data.model_dump(exclude_unset=True) and data.status == "finalizado":
        if not is_admin(current_user):
            raise HTTPException(403, "Only Admin or Jefe de Desarrollo can finalize tasks. Use the specific finalize endpoint.")
    
    old_project_id = t.project_id
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    db.flush()
    log_activity(db, current_user.id, "actualizar", "task", t.id, data.model_dump(mode='json', exclude_unset=True))
    _recalc_project_progress(db, old_project_id)
    if t.project_id != old_project_id:
        _recalc_project_progress(db, t.project_id)
    db.commit()
    db.refresh(t)
    return t


@router.get("/tasks_migrate_v2_debug")
def migrate_tasks_debug(db: Session = Depends(get_db)):
    from sqlalchemy import text
    results = []
    
    queries = [
        "ALTER TABLE tasks ADD COLUMN approved_by_id INTEGER REFERENCES users(id)",
        "ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE tasks ADD COLUMN total_time_spent FLOAT DEFAULT 0.0",
        "ALTER TABLE tasks ADD COLUMN history JSON DEFAULT '[]'::json"
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


@router.patch("/tasks/{task_id}/status")
def update_task_status(
    task_id: int,
    status: str = Query(..., description="New status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(404, "Task not found")
        
    from ..core.security import is_admin
    if not is_admin(current_user) and t.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task's status")

    if status == "finalizado" and not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or Jefe de Desarrollo can finalize tasks.")

    t.status = status
    if status == "finalizado":
        t.progress_percentage = 100
        t.approved_by_id = current_user.id
        from datetime import datetime
        t.completed_at = datetime.utcnow()
        if t.start_date:
            # We can calculate total_time_spent if we want, or just leave it.
            pass
        
        hist = list(t.history) if getattr(t, 'history', None) is not None else []
        hist.append({"event": "finalized", "by": current_user.id, "at": datetime.utcnow().isoformat()})
        t.history = hist

    db.flush()
    log_activity(db, current_user.id, "actualizar", "task", t.id, {"status": status})
    _recalc_project_progress(db, t.project_id)
    db.commit()
    return {"message": "Status updated"}

@router.post("/tasks/{task_id}/finalize")
def finalize_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(404, "Task not found")
        
    t.status = "finalizado"
    t.progress_percentage = 100
    t.approved_by_id = current_user.id
    
    from datetime import datetime
    t.completed_at = datetime.utcnow()
    
    hist = list(t.history) if getattr(t, 'history', None) is not None else []
    hist.append({"event": "finalized", "by": current_user.id, "at": datetime.utcnow().isoformat()})
    t.history = hist
    
    db.flush()
    log_activity(db, current_user.id, "finalizar", "task", t.id, {"status": "finalizado"})
    _recalc_project_progress(db, t.project_id)
    db.commit()
    return {"message": "Task finalized successfully"}


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(404, "Task not found")
    project_id = t.project_id
    log_activity(db, current_user.id, "eliminar", "task", t.id, {"title": t.title})
    db.delete(t)
    db.flush()
    _recalc_project_progress(db, project_id)
    db.commit()
    return {"message": "Task deleted"}
