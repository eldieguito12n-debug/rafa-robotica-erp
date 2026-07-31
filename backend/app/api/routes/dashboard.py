from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from ...core.database import get_db
from ...core.security import get_current_user, is_admin
from ...models import Project, Task, InventoryItem, InventoryMovement, FinancialRecord, Client, Lab, Message, Notification, CalendarEvent, ActivityLog, Developer, ProjectDeveloper, User, UserRole
from ...schemas import User as UserSchema, UserUpdate, DashboardStats, Project as ProjectSchema, Task as TaskSchema, InventoryItem as InventoryItemSchema, Lab as LabSchema

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
    
    tasks_query = db.query(Task).filter(Task.status.in_(["pendiente", "en_proceso"]))
    if not is_admin(current_user):
        tasks_query = tasks_query.filter(Task.assigned_to_id == current_user.id)
    pending_tasks = tasks_query.count()

    hours_worked = 0.0
    devs = db.query(Developer).all()
    for d in devs:
        hours_worked += d.hours_worked or 0

    monthly_sales = 0.0
    monthly_expenses = 0.0
    monthly_profit = 0.0
    new_clients = 0
    
    if is_admin(current_user):
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
    today = date.today()
    from datetime import timedelta
    from calendar import monthrange
    from sqlalchemy import func, extract

    if period == "week":
        labels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
        start = today - timedelta(days=today.weekday())
        ranges = [(start + timedelta(days=i), start + timedelta(days=i+1)) for i in range(7)]
    elif period == "year":
        labels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        ranges = []
        year = today.year
        for m in range(1, 13):
            s = date(year, m, 1)
            _, ld = monthrange(year, m)
            e = date(year, m, ld) + timedelta(days=1)
            ranges.append((s, e))
    else:  # month
        labels = ["Sem1", "Sem2", "Sem3", "Sem4"]
        first = today.replace(day=1)
        _, ld = monthrange(first.year, first.month)
        step = max(1, ld // 4)
        ranges = []
        d = first
        for i in range(4):
            start_d = d
            end_d = (d + timedelta(days=step)) if i < 3 else (first + timedelta(days=ld))
            ranges.append((start_d, end_d))
            d = end_d

    def frange(records, dates, filter_fld=None, filter_val=None, amount_fld=None):
        out = []
        for s, e in dates:
            q = records
            q = q.filter(filter_fld >= s, filter_fld < e)
            if filter_val is not None:
                # ya filtrado afuera
                pass
            if amount_fld is not None:
                s1 = q.with_entities(func.sum(amount_fld)).scalar() or 0
            else:
                s1 = q.count()
            out.append(round(float(s1), 2))
        return out

    color1, color2 = "#0066ff", "#00ff88"
    if chart_type == "sales" and is_admin(current_user):
        q = db.query(FinancialRecord).filter(FinancialRecord.type.in_(["ingreso", "venta"]))
        data1 = frange(q, ranges, FinancialRecord.date, amount_fld=FinancialRecord.amount)
        from ...models import Invoice
        q2 = db.query(Invoice)
        data2 = frange(q2, ranges, Invoice.created_at, amount_fld=Invoice.total)
        label1, label2 = "Ventas ($)", "Facturas emitidas"
        color1, color2 = "#00ff88", "#00aaff"
    elif chart_type == "expenses" and is_admin(current_user):
        q = db.query(FinancialRecord).filter(FinancialRecord.type.in_(["egreso", "compra"]))
        data1 = frange(q, ranges, FinancialRecord.date, amount_fld=FinancialRecord.amount)
        q2 = db.query(InventoryMovement).filter(InventoryMovement.type == "entrada")
        data2 = frange(q2, ranges, InventoryMovement.date, amount_fld=InventoryMovement.total_value)
        label1, label2 = "Gastos ($)", "Compras inventario"
        color1, color2 = "#ff4d6d", "#ffa94d"
    elif chart_type == "projects":
        q = db.query(Project)
        data1 = frange(q, ranges, Project.start_date)
        q2 = db.query(Project).filter(Project.status == "finalizado")
        data2 = frange(q2, ranges, Project.end_date if hasattr(Project, 'end_date') else Project.updated_at)
        label1, label2 = "Iniciados", "Finalizados"
        color1, color2 = "#7c5cff", "#00c2ff"
    elif chart_type == "tasks":
        q = db.query(Task)
        data1 = frange(q, ranges, Task.created_at)
        q2 = db.query(Task).filter(Task.status == "finalizado")
        data2 = frange(q2, ranges, Task.updated_at)
        label1, label2 = "Creadas", "Completadas"
        color1, color2 = "#f59f00", "#82c91e"
    elif chart_type == "inventory":
        q = db.query(InventoryMovement).filter(InventoryMovement.type == "entrada")
        data1 = frange(q, ranges, InventoryMovement.date, amount_fld=InventoryMovement.quantity)
        q2 = db.query(InventoryMovement).filter(InventoryMovement.type == "salida")
        data2 = frange(q2, ranges, InventoryMovement.date, amount_fld=InventoryMovement.quantity)
        label1, label2 = "Entradas (uds)", "Salidas (uds)"
        color1, color2 = "#20c997", "#e64980"
    else:
        data1 = [0]*len(labels)
        data2 = [0]*len(labels)
        label1, label2 = "Dataset 1", "Dataset 2"

    return {
        "labels": labels,
        "datasets": [
            {"label": label1, "data": data1, "color": color1},
            {"label": label2, "data": data2, "color": color2},
        ]
    }
