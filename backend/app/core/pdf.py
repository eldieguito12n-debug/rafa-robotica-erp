import os
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, HRFlowable
)
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.barcode import qr
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from sqlalchemy.orm import Session
from ..models import Invoice, Quote, Client, Project


EMPRESA_DUMMY = {
    "nombre": "Rafa Robótica S.A.S.",
    "nit": "NIT 901.987.654-3",
    "direccion": "Parque Industrial, Bodega 4, Bogotá D.C.",
    "telefono": "+57 300 123 4567",
    "email": "contacto@rafarobotica.com",
    "web": "www.rafarobotica.com",
    "slogan": "Automatización y Robótica para el Futuro",
}


def _get_company_header_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="CompanyName",
        fontName="Helvetica-Bold",
        fontSize=20,
        textColor=colors.HexColor("#1e3a5f"),
        spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        name="CompanyDetail",
        fontName="Helvetica",
        fontSize=9,
        textColor=colors.HexColor("#444444"),
        spaceAfter=1,
    ))
    styles.add(ParagraphStyle(
        name="DocTitle",
        fontName="Helvetica-Bold",
        fontSize=18,
        textColor=colors.HexColor("#1e3a5f"),
        alignment=1,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="DocSubtitle",
        fontName="Helvetica",
        fontSize=10,
        textColor=colors.HexColor("#666666"),
        alignment=1,
        spaceAfter=10,
    ))
    styles.add(ParagraphStyle(
        name="SectionTitle",
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=colors.HexColor("#1e3a5f"),
        spaceBefore=8,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="LabelText",
        fontName="Helvetica-Bold",
        fontSize=9,
        textColor=colors.HexColor("#333333"),
    ))
    styles.add(ParagraphStyle(
        name="ValueText",
        fontName="Helvetica",
        fontSize=9,
        textColor=colors.HexColor("#333333"),
    ))
    styles.add(ParagraphStyle(
        name="NotesText",
        fontName="Helvetica",
        fontSize=9,
        textColor=colors.HexColor("#555555"),
    ))
    styles.add(ParagraphStyle(
        name="FooterText",
        fontName="Helvetica-Oblique",
        fontSize=8,
        textColor=colors.HexColor("#888888"),
        alignment=1,
    ))
    return styles


def _build_company_header(styles, width=7.0 * inch):
    empresa = EMPRESA_DUMMY
    
    # Try to load app logo round
    logo_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "app_logo_round.png")
    logo_flowable = None
    if os.path.exists(logo_path):
        try:
            logo_flowable = Image(logo_path, width=1.0*inch, height=1.0*inch, kind='proportional')
        except Exception:
            pass
            
    header_left = []
    if logo_flowable:
        left_tbl = Table([[
            logo_flowable, 
            [Paragraph(empresa["nombre"], styles["CompanyName"]), Spacer(1, 10), Paragraph(empresa["slogan"], styles["CompanyDetail"])]
        ]], colWidths=[1.2*inch, 2.9*inch])
        left_tbl.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ]))
        header_left.append(left_tbl)
    else:
        header_left.append(Paragraph(empresa["nombre"], styles["CompanyName"]))
        header_left.append(Spacer(1, 10))
        header_left.append(Paragraph(empresa["slogan"], styles["CompanyDetail"]))
        
    data = [
        [
            header_left,
            [
                Paragraph("<b>COTIZACIÓN</b>", styles["DocTitle"]),
                Paragraph(f"{empresa['nit']}<br/>{empresa['telefono']}<br/>{empresa['email']}", styles["CompanyDetail"])
            ]
        ]
    ]
    header_table = Table(data, colWidths=[width * 0.60, width * 0.40])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    
    return [header_table, Spacer(1, 10),
            HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#f1c40f")),
            Spacer(1, 15)]


def _client_info_section(client: Client, project: Project = None):
    lines = []
    lines.append(["<b>Cliente:</b>", client.company_name or (client.user.full_name if client and client.user else "N/A")])
    if client and client.nit:
        lines.append(["<b>NIT/CC:</b>", client.nit])
    if client and client.contact_name:
        lines.append(["<b>Contacto:</b>", f"{client.contact_name} - {client.contact_phone or ''}"])
    if client and client.address:
        lines.append(["<b>Dirección:</b>", client.address])
    if project and project.name:
        lines.append(["<b>Proyecto:</b>", project.name])
    return lines


def _build_items_table(items, styles):
    header = ["#", "Descripción", "Cant.", "Valor Unit.", "Subtotal"]
    data = [header]
    total_items = 0
    for idx, it in enumerate(items or [], start=1):
        desc = it.get("description") or it.get("name") or ""
        qty = it.get("quantity") or it.get("qty") or 0
        price = it.get("unit_price") or it.get("price") or it.get("value") or 0
        subtotal = it.get("subtotal") or (qty * price)
        total_items += subtotal
        data.append([
            str(idx),
            Paragraph(str(desc), styles["ValueText"]),
            str(qty),
            f"${float(price):,.0f}",
            f"${float(subtotal):,.0f}",
        ])
    if not items:
        data.append(["-", "Sin ítems", "-", "-", "-"])
    tbl = Table(data, colWidths=[0.35 * inch, 3.6 * inch, 0.6 * inch, 1.1 * inch, 1.1 * inch])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("ALIGN", (2, 0), (2, -1), "CENTER"),
        ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f7fa")]),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return tbl, total_items


def _build_totals_box(subtotal, tax, discount, total, styles):
    data = [
        ["Subtotal:", f"${float(subtotal or 0):,.0f}"],
        ["Descuento (-):", f"${float(discount or 0):,.0f}"],
        ["Impuesto (+):", f"${float(tax or 0):,.0f}"],
        ["TOTAL:", f"${float(total or 0):,.0f}"],
    ]
    tbl = Table(data, colWidths=[4.3 * inch, 2.2 * inch])
    tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -2), "Helvetica-Bold"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTNAME", (-1, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#1e3a5f")),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.white),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#cccccc")),
    ]))
    return tbl


def generate_invoice_pdf_bytes(db: Session, invoice_id: int) -> bytes:
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise ValueError(f"Invoice {invoice_id} not found")
    client = invoice.client
    project = invoice.project

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=0.7 * inch, rightMargin=0.7 * inch,
        topMargin=0.6 * inch, bottomMargin=0.7 * inch,
        title=f"Factura_{invoice_id}"
    )
    styles = _get_company_header_styles()
    story = []

    story.extend(_build_company_header(styles))

    story.append(Paragraph(f"FACTURA DE VENTA #{invoice.invoice_number or invoice.id}", styles["DocTitle"]))
    status_str = (invoice.status.value if hasattr(invoice.status, 'value') else str(invoice.status)).upper()
    story.append(Paragraph(
        f"ID: {invoice.id} &nbsp;|&nbsp; Fecha: {invoice.date} &nbsp;|&nbsp; Estado: {status_str}"
        f"{(' &nbsp;|&nbsp; Vence: ' + str(invoice.due_date)) if invoice.due_date else ''}",
        styles["DocSubtitle"]
    ))

    client_lines = _client_info_section(client, project)
    if client_lines:
        story.append(Paragraph("Información del Cliente", styles["SectionTitle"]))
        cl_data = [[Paragraph(l[0], styles["LabelText"]), Paragraph(l[1], styles["ValueText"])] for l in client_lines]
        cl_tbl = Table(cl_data, colWidths=[1.2 * inch, 5.0 * inch])
        cl_tbl.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        story.append(cl_tbl)
        story.append(Spacer(1, 10))

    story.append(Paragraph("Detalle de la Factura", styles["SectionTitle"]))
    items_tbl, _ = _build_items_table(invoice.items or [], styles)
    story.append(items_tbl)
    story.append(Spacer(1, 12))

    totals = _build_totals_box(invoice.subtotal, invoice.tax, invoice.discount, invoice.total, styles)
    story.append(totals)

    if invoice.notes:
        story.append(Spacer(1, 14))
        story.append(Paragraph("Notas", styles["SectionTitle"]))
        story.append(Paragraph(str(invoice.notes), styles["NotesText"]))

    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="60%", thickness=0.5, color=colors.HexColor("#aaaaaa")))
    story.append(Spacer(1, 3))
    story.append(Paragraph("Firma Autorizada / Sello", styles["FooterText"]))

    story.append(Spacer(1, 10))
    story.append(Paragraph(
        f"RoboLab S.A.S. - Documento generado automáticamente. Gracias por su preferencia.",
        styles["FooterText"]
    ))

    doc.build(story)
    return buffer.getvalue()


def generate_quote_pdf_bytes(db: Session, quote_id: int) -> bytes:
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise ValueError(f"Quote {quote_id} not found")
    client = quote.client
    project = quote.project

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=0.7 * inch, rightMargin=0.7 * inch,
        topMargin=0.6 * inch, bottomMargin=0.7 * inch,
        title=f"Cotizacion_{quote_id}"
    )
    styles = _get_company_header_styles()
    story = []

    story.extend(_build_company_header(styles))

    # Header info box
    dt = quote.created_at or quote.date or datetime.now()
    date_str = getattr(dt, 'strftime', lambda x: str(dt))('%d / %m / %Y')
    
    quote_num = str(quote.quote_number or quote.id)
    status_str = (quote.status.value if hasattr(quote.status, 'value') else str(quote.status)).upper()
    valid_str = str(quote.valid_until) if quote.valid_until else "N/A"
    gen_by = quote.created_by.full_name if hasattr(quote, 'created_by') and quote.created_by else "Admin"
    
    info_data = [
        [Paragraph("<b>Fecha:</b>", styles["LabelText"]), Paragraph(date_str, styles["ValueText"]),
         Paragraph("<b>N° Cotización:</b>", styles["LabelText"]), Paragraph(quote_num, styles["ValueText"])],
        [Paragraph("<b>Generado por:</b>", styles["LabelText"]), Paragraph(gen_by, styles["ValueText"]),
         Paragraph("<b>Estado:</b>", styles["LabelText"]), Paragraph(status_str, styles["ValueText"])],
        [Paragraph("<b>Válido hasta:</b>", styles["LabelText"]), Paragraph(valid_str, styles["ValueText"]),
         "", ""]
    ]
    info_tbl = Table(info_data, colWidths=[1.1*inch, 2.4*inch, 1.1*inch, 2.4*inch])
    info_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8f9fa")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(info_tbl)
    story.append(Spacer(1, 15))

    client_lines = _client_info_section(client, project)
    if client_lines:
        story.append(Paragraph("Datos del Cliente", styles["SectionTitle"]))
        cl_data = [[Paragraph(l[0], styles["LabelText"]), Paragraph(l[1], styles["ValueText"])] for l in client_lines]
        cl_tbl = Table(cl_data, colWidths=[1.2 * inch, 5.8 * inch])
        cl_tbl.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#eeeeee")),
        ]))
        story.append(cl_tbl)
        story.append(Spacer(1, 15))

    story.append(Paragraph("Productos / Servicios", styles["SectionTitle"]))
    items_tbl, _ = _build_items_table(quote.items or [], styles)
    # Modify items table style for native look
    items_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ALIGN", (2, 1), (-1, -1), "CENTER"), # cant
        ("ALIGN", (3, 1), (-1, -1), "RIGHT"),  # unit
        ("ALIGN", (4, 1), (-1, -1), "RIGHT"),  # subtotal
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
    ]))
    story.append(items_tbl)
    story.append(Spacer(1, 15))

    # Totals and Notes Side by Side
    notes_para = Paragraph(f"<b>Observaciones:</b><br/>{quote.notes or 'Ninguna'}", styles["NotesText"])
    
    tot_data = [
        ["Subtotal:", f"${float(quote.subtotal or 0):,.2f}"],
        ["Descuento:", f"${float(quote.discount or 0):,.2f}"],
        ["IVA:", f"${float(quote.tax or 0):,.2f}"],
        ["Total a Pagar:", f"${float(quote.total or 0):,.2f}"]
    ]
    tot_tbl = Table(tot_data, colWidths=[2.0*inch, 1.8*inch])
    tot_tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f1c40f")),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.black),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    
    bottom_tbl = Table([[notes_para, tot_tbl]], colWidths=[3.2*inch, 3.8*inch])
    bottom_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
    ]))
    story.append(bottom_tbl)
    
    story.append(Spacer(1, 40))
    
    # Firmas
    sig_data = [
        [HRFlowable(width="80%", thickness=0.5, color=colors.HexColor("#aaaaaa")),
         HRFlowable(width="80%", thickness=0.5, color=colors.HexColor("#aaaaaa"))],
        [Paragraph(f"Firma Cliente<br/>{client.nit if client else ''}", styles["FooterText"]),
         Paragraph("Firma Responsable<br/>Rafa Robótica S.A.S.", styles["FooterText"])]
    ]
    sig_tbl = Table(sig_data, colWidths=[3.5 * inch, 3.5 * inch])
    sig_tbl.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(sig_tbl)

    story.append(Spacer(1, 20))
    
    # QR Code
    try:
        url = f"https://rafarobotica.com/quotes/{quote.id}"
        qr_code = qr.QrCodeWidget(url)
        bounds = qr_code.getBounds()
        w, h = bounds[2] - bounds[0], bounds[3] - bounds[1]
        d = Drawing(60, 60, transform=[60./w, 0, 0, 60./h, 0, 0])
        d.add(qr_code)
        
        qr_data = [[d, Paragraph("Escanea este código para consultar esta cotización digitalmente.", styles["FooterText"])]]
        qr_tbl = Table(qr_data, colWidths=[1.0 * inch, 5.5 * inch])
        qr_tbl.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(qr_tbl)
    except Exception:
        pass

    doc.build(story)
    return buffer.getvalue()


def generate_financial_summary_pdf_bytes(records, title="Resumen Financiero") -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=0.7 * inch, rightMargin=0.7 * inch,
        topMargin=0.6 * inch, bottomMargin=0.7 * inch,
        title="Reporte_Financiero"
    )
    styles = _get_company_header_styles()
    story = []

    story.extend(_build_company_header(styles))
    story.append(Paragraph(title.upper(), styles["DocTitle"]))

    total_ingresos = sum(r["amount"] for r in records if str(r.get("type", "")).lower() in ("ingreso", "venta"))
    total_egresos = sum(r["amount"] for r in records if str(r.get("type", "")).lower() in ("egreso", "compra"))
    utilidad = total_ingresos - total_egresos

    summary_data = [
        ["Total Ingresos:", f"${total_ingresos:,.0f}"],
        ["Total Egresos:", f"${total_egresos:,.0f}"],
        ["Utilidad Neta:", f"${utilidad:,.0f}"],
        ["Transacciones:", f"{len(records)}"],
    ]
    st = Table(summary_data, colWidths=[3.0 * inch, 3.0 * inch])
    st.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 12),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#1e3a5f")),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(st)
    story.append(Spacer(1, 18))

    story.append(Paragraph("Detalle de Registros", styles["SectionTitle"]))
    header = ["Fecha", "Tipo", "Descripción", "Referencia", "Monto"]
    data = [header]
    for r in records:
        data.append([
            str(r.get("date", "")),
            str(r.get("type", "")).upper(),
            Paragraph(str(r.get("description", ""))[:80], styles["ValueText"]),
            str(r.get("reference", "") or ""),
            f"${float(r.get('amount', 0)):,.0f}",
        ])
    tbl = Table(data, colWidths=[0.9 * inch, 0.9 * inch, 3.0 * inch, 1.1 * inch, 1.1 * inch], repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#cccccc")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f7fa")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(tbl)

    doc.build(story)
    return buffer.getvalue()
