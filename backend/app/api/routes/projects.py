from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ...core.database import get_db
from ...core.security import get_current_user, require_roles
from ...models import Project, Task, ProjectDeveloper, User
from ...schemas import Project as ProjectSchema, ProjectCreate, ProjectUpdate, ProjectDeveloperCreate, Task as TaskSchema, TaskCreate, TaskUpdate

router = APIRouter(tags=["Projects & Tasks"])


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
    current_user: User = Depends(require_roles("administrador", "jefe_desarrollo")),
):
    p = Project(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.get("/projects/{project_id}", response_model=ProjectSchema)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(404, "Project not found")
    return p


@router.put("/projects/{project_id}", response_model=ProjectSchema)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(404, "Project not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/projects/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador", "jefe_desarrollo")),
):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(404, "Project not found")
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
    current_user: User = Depends(get_current_user),
):
    pd = ProjectDeveloper(**data.model_dump())
    pd.project_id = project_id
    db.add(pd)
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
    current_user: User = Depends(require_roles("administrador", "jefe_desarrollo")),
):
    t = Task(**data.model_dump())
    t.created_by_id = current_user.id
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/tasks/{task_id}", response_model=TaskSchema)
def get_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(404, "Task not found")
    return t


@router.put("/tasks/{task_id}", response_model=TaskSchema)
def update_task(
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(404, "Task not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return t


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
    t.status = status
    if status == "finalizado":
        t.progress_percentage = 100
    db.commit()
    return {"message": "Status updated"}


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador", "jefe_desarrollo")),
):
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(404, "Task not found")
    db.delete(t)
    db.commit()
    return {"message": "Task deleted"}
