from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from ...core.database import get_db
from ...core.security import get_current_user, require_roles
from ...models import FinancialRecord, Invoice, Payment, Quote, Client, User
from ...schemas import (
    FinancialRecord as FinSchema, FinancialRecordCreate,
    Invoice as InvoiceSchema, InvoiceCreate,
    Payment as PaymentSchema, PaymentCreate,
    Quote as QuoteSchema, QuoteCreate,
    Client as ClientSchema,
)

router = APIRouter(tags=["Financial & Clients"])


# ===== FINANCIAL RECORDS =====
@router.get("/financial", response_model=List[FinSchema])
def list_financial(
    type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador", "contador")),
):
    q = db.query(FinancialRecord)
    if type:
        q = q.filter(FinancialRecord.type == type)
    if date_from:
        q = q.filter(FinancialRecord.date >= date_from)
    if date_to:
        q = q.filter(FinancialRecord.date <= date_to)
    if category:
        q = q.filter(FinancialRecord.category == category)
    return q.order_by(FinancialRecord.date.desc()).all()


@router.post("/financial", response_model=FinSchema)
def create_financial_record(
    data: FinancialRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador", "contador")),
):
    if not data.user_id:
        data.user_id = current_user.id
    r = FinancialRecord(**data.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.get("/financial/summary")
def get_financial_summary(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador", "contador")),
):
    q = db.query(FinancialRecord)
    if date_from:
        q = q.filter(FinancialRecord.date >= date_from)
    if date_to:
        q = q.filter(FinancialRecord.date <= date_to)
    records = q.all()
    total_ingresos = sum(r.amount for r in records if (r.type.value if hasattr(r.type, 'value') else str(r.type)) in ("ingreso", "venta"))
    total_egresos = sum(r.amount for r in records if (r.type.value if hasattr(r.type, 'value') else str(r.type)) in ("egreso", "compra"))
    return {
        "total_ingresos": round(total_ingresos, 2),
        "total_egresos": round(total_egresos, 2),
        "utilidad": round(total_ingresos - total_egresos, 2),
        "caja_diaria": round(total_ingresos - total_egresos, 2),
        "total_records": len(records),
    }


# ===== INVOICES =====
@router.get("/invoices", response_model=List[InvoiceSchema])
def list_invoices(
    status: Optional[str] = None,
    client_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Invoice)
    if status:
        q = q.filter(Invoice.status == status)
    if client_id:
        q = q.filter(Invoice.client_id == client_id)
    return q.order_by(Invoice.created_at.desc()).all()


@router.post("/invoices", response_model=InvoiceSchema)
def create_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador", "contador")),
):
    i = Invoice(**data.model_dump())
    db.add(i)
    db.commit()
    db.refresh(i)
    return i


@router.get("/invoices/{invoice_id}", response_model=InvoiceSchema)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    i = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not i:
        raise HTTPException(404, "Invoice not found")
    return i


# ===== PAYMENTS =====
@router.post("/payments", response_model=PaymentSchema)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador", "contador")),
):
    p = Payment(**data.model_dump())
    inv = db.query(Invoice).filter(Invoice.id == data.invoice_id).first()
    if inv:
        paid = sum(x.amount for x in inv.payments) + p.amount
        if paid >= inv.total:
            inv.status = "pagada"
        else:
            inv.status = "parcial"
        db.add(inv)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.get("/payments", response_model=List[PaymentSchema])
def list_payments(client_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Payment)
    if client_id:
        q = q.filter(Payment.client_id == client_id)
    return q.order_by(Payment.created_at.desc()).all()


# ===== QUOTES =====
@router.get("/quotes", response_model=List[QuoteSchema])
def list_quotes(status: Optional[str] = None, client_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Quote)
    if status:
        q = q.filter(Quote.status == status)
    if client_id:
        q = q.filter(Quote.client_id == client_id)
    return q.order_by(Quote.created_at.desc()).all()


@router.post("/quotes", response_model=QuoteSchema)
def create_quote(
    data: QuoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador", "jefe_desarrollo", "contador")),
):
    q = Quote(**data.model_dump())
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.get("/quotes/{quote_id}", response_model=QuoteSchema)
def get_quote(quote_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Quote).filter(Quote.id == quote_id).first()
    if not q:
        raise HTTPException(404, "Quote not found")
    return q


@router.post("/quotes/{quote_id}/approve")
def approve_quote(quote_id: int, convert_to_project: bool = False, db: Session = Depends(get_db), current_user: User = Depends(require_roles("administrador"))):
    q = db.query(Quote).filter(Quote.id == quote_id).first()
    if not q:
        raise HTTPException(404, "Quote not found")
    q.status = "aprobada"
    db.commit()
    return {"message": "Quote approved"}
