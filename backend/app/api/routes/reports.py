from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from io import BytesIO
from calendar import monthrange
from ...core.database import get_db
from ...core.security import require_roles
from ...core.excel import generate_report_excel_bytes, generate_inventory_excel_bytes
from ...core.pdf import generate_financial_summary_pdf_bytes
from ...models import FinancialRecord, InventoryItem, Project, User, ProjectStatus
from ... import models


router = APIRouter(tags=["Reports"])


def _get_period_range(period: str = "month") -> tuple[date, date]:
    today = date.today()
    if period == "year":
        start = date(today.year, 1, 1)
        end = date(today.year, 12, 31)
    elif period == "quarter":
        q = (today.month - 1) // 3
        start_month = q * 3 + 1
        end_month = start_month + 2
        start = date(today.year, start_month, 1)
        _, last_day = monthrange(today.year, end_month)
        end = date(today.year, end_month, last_day)
    else:
        start = date(today.year, today.month, 1)
        _, last_day = monthrange(today.year, today.month)
        end = date(today.year, today.month, last_day)
    return start, end


def _financial_record_to_dict(r) -> Dict[str, Any]:
    rtype = r.type
    if hasattr(rtype, "value"):
        rtype = rtype.value
    return {
        "id": r.id, "date": r.date, "type": rtype,
        "description": r.description, "category": r.category or "",
        "reference": r.reference or "", "payment_method": r.payment_method or "",
        "amount": r.amount,
    }


@router.get("/reports/general")
def download_general_report(
    period: str = Query("month", description="month | quarter | year"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("administrador", "contador")),
):
    start, end = _get_period_range(period)

    q = db.query(FinancialRecord).filter(
        FinancialRecord.date >= start, FinancialRecord.date <= end
    ).order_by(FinancialRecord.date.desc())
    records = q.all()
    records_dicts: List[Dict[str, Any]] = [_financial_record_to_dict(r) for r in records]

    excel_bytes = generate_report_excel_bytes("general", records_dicts)
    date_str = datetime.now().strftime("%Y%m%d")
    filename = f"reporte_general_{date_str}.xlsx"

    return StreamingResponse(
        BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/reports/download.pdf")
def download_financial_pdf_report(
    type: str = Query("financial", description="financial | inventario | proyectos"),
    period: str = Query("month", description="month | quarter | year"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("administrador", "contador")),
):
    start, end = _get_period_range(period)

    q = db.query(FinancialRecord).filter(
        FinancialRecord.date >= start, FinancialRecord.date <= end
    ).order_by(FinancialRecord.date.desc())
    records = q.all()
    records_dicts: List[Dict[str, Any]] = [_financial_record_to_dict(r) for r in records]

    title = f"Resumen Financiero - {period.upper()} ({start} a {end})"
    pdf_bytes = generate_financial_summary_pdf_bytes(records_dicts, title=title)

    filename = f"reporte_financiero_{datetime.now().strftime('%Y%m%d')}.pdf"

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
