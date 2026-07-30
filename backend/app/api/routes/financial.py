from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from io import BytesIO
from ...core.database import get_db
from ...core.security import get_current_user, require_roles
from ...core.activity_middleware import log_activity
from ...core.pdf import generate_invoice_pdf_bytes, generate_quote_pdf_bytes
from ...models import FinancialRecord, Invoice, Payment, Quote, Client, User
from ...schemas import (
    FinancialRecord as FinSchema, FinancialRecordCreate,
    Invoice as InvoiceSchema, InvoiceCreate,
    Payment as PaymentSchema, PaymentCreate,
    Quote as QuoteSchema, QuoteCreate,
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
    db.flush()
    log_activity(db, current_user.id, "crear", "financial_record", r.id, data.model_dump())
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
    db.flush()
    log_activity(db, current_user.id, "crear", "invoice", i.id, data.model_dump())
    db.commit()
    db.refresh(i)
    return i


@router.get("/invoices/{invoice_id}", response_model=InvoiceSchema)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    i = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not i:
        raise HTTPException(404, "Invoice not found")
    return i


@router.get("/invoices/{invoice_id}/download")
def download_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    i = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not i:
        raise HTTPException(404, "Invoice not found")
    pdf_bytes = generate_invoice_pdf_bytes(db, invoice_id)
    filename = f"Factura_{invoice_id}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


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
        paid = sum(x.amount for x in inv.payments if x.id != p.id) + p.amount
        if paid >= inv.total:
            inv.status = "pagada"
        else:
            inv.status = "parcial"
        db.add(inv)
    db.add(p)
    db.flush()
    log_activity(db, current_user.id, "crear", "payment", p.id, data.model_dump())
    # Regla de negocio 2: todo pago se convierte en un FinancialRecord de ingreso
    inv = db.query(Invoice).filter(Invoice.id == data.invoice_id).first()
    from datetime import datetime
    from ...models import FinancialRecord as FR
    rec = FR(
        type="ingreso",
        category=f"Pago factura #{p.id}",
        amount=p.amount,
        date=datetime.utcnow().date(),
        description=f"Pago realizado. Factura #{data.invoice_id}. Método: {p.payment_method or 'N/A'}",
        reference=f"PAY-{p.id}",
        user_id=current_user.id,
        client_id=inv.client_id if inv else (getattr(p, 'client_id', None) or None),
        project_id=inv.project_id if inv and hasattr(inv, 'project_id') else None,
        created_at=datetime.utcnow(),
    )
    db.add(rec)
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
    db.flush()
    log_activity(db, current_user.id, "crear", "quote", q.id, data.model_dump())
    db.commit()
    db.refresh(q)
    return q


@router.get("/quotes/{quote_id}", response_model=QuoteSchema)
def get_quote(quote_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Quote).filter(Quote.id == quote_id).first()
    if not q:
        raise HTTPException(404, "Quote not found")
    return q


@router.get("/quotes/{quote_id}/download")
def download_quote_pdf(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Quote).filter(Quote.id == quote_id).first()
    if not q:
        raise HTTPException(404, "Quote not found")
    pdf_bytes = generate_quote_pdf_bytes(db, quote_id)
    filename = f"Cotizacion_{quote_id}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/quotes/{quote_id}/approve")
def approve_quote(quote_id: int, convert_to_project: bool = False, db: Session = Depends(get_db), current_user: User = Depends(require_roles("administrador"))):
    q = db.query(Quote).filter(Quote.id == quote_id).first()
    if not q:
        raise HTTPException(404, "Quote not found")
    q.status = "aprobada"
    db.flush()
    log_activity(db, current_user.id, "actualizar", "quote", q.id, {"status": "aprobada", "convert_to_project": convert_to_project})
    if convert_to_project:
        from ...models import Project
        from datetime import datetime
        p = Project(
            name=q.title or f"Proyecto desde Cotización #{q.id}",
            client_id=q.client_id,
            description=q.notes or "",
            budget=q.total_amount,
            start_date=date.today(),
            status="planeacion",
            progress_percentage=0,
            created_at=datetime.utcnow(),
        )
        db.add(p)
        db.flush()
        log_activity(db, current_user.id, "crear", "project", p.id, {"source": "quote", "quote_id": q.id})
    db.commit()
    return {"message": "Quote approved", "project_created": convert_to_project}


# ===== FINANCIAL RECORDS: Detail, Update, Delete =====
@router.get("/financial/{record_id}", response_model=FinSchema)
def get_financial_record(record_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("administrador", "contador"))):
    r = db.query(FinancialRecord).filter(FinancialRecord.id == record_id).first()
    if not r:
        raise HTTPException(404, "Record not found")
    return r


@router.put("/financial/{record_id}", response_model=FinSchema)
def update_financial_record(
    record_id: int,
    data: FinancialRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador", "contador")),
):
    r = db.query(FinancialRecord).filter(FinancialRecord.id == record_id).first()
    if not r:
        raise HTTPException(404, "Record not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(r, k, v)
    db.flush()
    log_activity(db, current_user.id, "actualizar", "financial_record", r.id, data.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(r)
    return r


@router.delete("/financial/{record_id}")
def delete_financial_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador")),
):
    r = db.query(FinancialRecord).filter(FinancialRecord.id == record_id).first()
    if not r:
        raise HTTPException(404, "Record not found")
    log_activity(db, current_user.id, "eliminar", "financial_record", r.id, {"description": r.description, "amount": r.amount})
    db.delete(r)
    db.commit()
    return {"message": "Record deleted"}


# ===== INVOICES: Update, Delete =====
@router.put("/invoices/{invoice_id}", response_model=InvoiceSchema)
def update_invoice(
    invoice_id: int,
    data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador", "contador")),
):
    i = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not i:
        raise HTTPException(404, "Invoice not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(i, k, v)
    db.flush()
    log_activity(db, current_user.id, "actualizar", "invoice", i.id, data.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(i)
    return i


@router.delete("/invoices/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador")),
):
    i = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not i:
        raise HTTPException(404, "Invoice not found")
    log_activity(db, current_user.id, "eliminar", "invoice", i.id, {"invoice_number": i.invoice_number})
    db.delete(i)
    db.commit()
    return {"message": "Invoice deleted"}


# ===== PAYMENTS: Detail, Update, Delete =====
@router.get("/payments/{payment_id}", response_model=PaymentSchema)
def get_payment(payment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = db.query(Payment).filter(Payment.id == payment_id).first()
    if not p:
        raise HTTPException(404, "Payment not found")
    return p


@router.put("/payments/{payment_id}", response_model=PaymentSchema)
def update_payment(
    payment_id: int,
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador", "contador")),
):
    p = db.query(Payment).filter(Payment.id == payment_id).first()
    if not p:
        raise HTTPException(404, "Payment not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.flush()
    log_activity(db, current_user.id, "actualizar", "payment", p.id, data.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(p)
    return p


@router.delete("/payments/{payment_id}")
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador")),
):
    p = db.query(Payment).filter(Payment.id == payment_id).first()
    if not p:
        raise HTTPException(404, "Payment not found")
    inv = db.query(Invoice).filter(Invoice.id == p.invoice_id).first()
    log_activity(db, current_user.id, "eliminar", "payment", p.id, {"amount": p.amount, "invoice_id": p.invoice_id})
    db.delete(p)
    db.flush()
    # Recalcula estado de factura
    if inv:
        paid = sum(x.amount for x in inv.payments if x.id != p.id)
        if paid <= 0:
            inv.status = "pendiente"
        elif paid >= inv.total:
            inv.status = "pagada"
        else:
            inv.status = "parcial"
        db.add(inv)
    db.commit()
    return {"message": "Payment deleted"}


# ===== QUOTES: Reject, Update, Delete =====
@router.post("/quotes/{quote_id}/reject")
def reject_quote(quote_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("administrador", "jefe_desarrollo"))):
    q = db.query(Quote).filter(Quote.id == quote_id).first()
    if not q:
        raise HTTPException(404, "Quote not found")
    q.status = "rechazada"
    db.flush()
    log_activity(db, current_user.id, "actualizar", "quote", q.id, {"status": "rechazada"})
    db.commit()
    return {"message": "Quote rejected"}


@router.put("/quotes/{quote_id}", response_model=QuoteSchema)
def update_quote(
    quote_id: int,
    data: QuoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador", "jefe_desarrollo", "contador")),
):
    q = db.query(Quote).filter(Quote.id == quote_id).first()
    if not q:
        raise HTTPException(404, "Quote not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(q, k, v)
    db.flush()
    log_activity(db, current_user.id, "actualizar", "quote", q.id, data.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(q)
    return q


@router.delete("/quotes/{quote_id}")
def delete_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("administrador")),
):
    q = db.query(Quote).filter(Quote.id == quote_id).first()
    if not q:
        raise HTTPException(404, "Quote not found")
    log_activity(db, current_user.id, "eliminar", "quote", q.id, {"quote_number": q.quote_number})
    db.delete(q)
    db.commit()
    return {"message": "Quote deleted"}
