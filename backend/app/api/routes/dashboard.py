from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from ...core.database import get_db
from ...core.security import get_current_user, require_roles
from ...models import Project, Task, InventoryItem, InventoryMovement, FinancialRecord, Client, Lab, Message, Notification, CalendarEvent, ActivityLog, Developer, ProjectDeveloper, User, UserRole
from ...schemas import User as UserSchema, UserUpdate, DashboardStats, Project, Task, InventoryItem, Lab

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    first_day_month = today.replace(day=1)

    active_projects = db.query(Project).filter(Project.status.in_(["en_progreso", "pendiente", "en_pruebas"])).count()
    completed_projects = db.query(Project).filter(Project.status == "finalizado").count()
    connected_developers = db.query(Developer).filter(Developer.status == "activo").count()
    pending_tasks = db.query(Task).filter(Task.status.in_(["pendiente", "en_proceso"])).count()

    hours_worked = 0.0
    devs = db.query(Developer).all()
    for d in devs:
        hours_worked += d.hours_worked or 0

    monthly_sales = 0.0
    monthly_expenses = 0.0
    records = db.query(FinancialRecord).filter(FinancialRecord.date >= first_day_month).all()
    for r in records:
        if r.type in ("ingreso", "venta"):
            monthly_sales += r.amount or 0
        elif r.type in ("egreso", "compra"):
            monthly_expenses += r.amount or 0

    monthly_profit = monthly_sales - monthly_expenses
    new_clients = db.query(Client).filter(Client.created_at >= first_day_month).count()

    labs = db.query(Lab).all()
    recent_logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(10).all()
    recent_activity = []
    for log in recent_logs:
        u = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
        recent_activity.append({
            "id": log.id,
            "action": log.action,
            "user": u.full_name if u else "System",
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "time": log.created_at.isoformat() if log.created_at else None,
        })

    kpis = {
        "project_completion_rate": round((completed_projects / (active_projects + completed_projects) * 100), 1) if (active_projects + completed_projects) > 0 else 0,
        "avg_task_progress": round(db.query(Task).with_entities(db.func.avg(Task.progress_percentage)).scalar() or 0, 1),
        "inventory_value": round(db.query(InventoryItem).with_entities(db.func.sum(InventoryItem.quantity * InventoryItem.unit_cost)).scalar() or 0, 2),
        "low_stock_items": db.query(InventoryItem).filter(InventoryItem.quantity <= InventoryItem.min_stock).count(),
        "profit_margin": round((monthly_profit / monthly_sales * 100), 1) if monthly_sales > 0 else 0,
    }

    return DashboardStats(
        active_projects=active_projects,
        completed_projects=completed_projects,
        connected_developers=connected_developers,
        pending_tasks=pending_tasks,
        hours_worked=hours_worked,
        monthly_sales=round(monthly_sales, 2),
        monthly_expenses=round(monthly_expenses, 2),
        monthly_profit=round(monthly_profit, 2),
        new_clients=new_clients,
        labs=labs,
        recent_activity=recent_activity,
        kpis=kpis,
    )


@router.get("/chart-data")
def get_chart_data(
    chart_type: str = Query(..., description="Type: sales, expenses, projects, tasks, inventory"),
    period: str = Query("month", description="period: week, month, year"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    import random
    labels_map = {
        "week": ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        "month": ["Sem1", "Sem2", "Sem3", "Sem4"],
        "year": ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    }
    labels = labels_map.get(period, labels_map["month"])
    data1 = [random.randint(100, 1000) for _ in labels]
    data2 = [random.randint(50, 800) for _ in labels]

    return {
        "labels": labels,
        "datasets": [
            {"label": chart_type.capitalize(), "data": data1, "color": "#0066ff"},
            {"label": "Comparativo", "data": data2, "color": "#00ff88"},
        ]
    }
