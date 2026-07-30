from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, Date, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from ..core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "administrador"
    ADMINISTRADORA = "administradora"
    JEFE_DESARROLLO = "jefe_desarrollo"
    INGENIERO_ELECTRONICO = "ingeniero_electronico"
    PROGRAMADOR = "programador"
    DISENADOR_CAD = "disenador_cad"
    TECNICO = "tecnico"
    CONTADOR = "contador"
    CLIENTE = "cliente"


class DeveloperAvailability(str, enum.Enum):
    DISPONIBLE = "disponible"
    OCUPADO = "ocupado"
    VACACIONES = "vacaciones"
    AUSENTE = "ausente"


class DeveloperStatus(str, enum.Enum):
    ACTIVO = "activo"
    INACTIVO = "inactivo"
    SUSPENDIDO = "suspendido"


class ProjectStatus(str, enum.Enum):
    PENDIENTE = "pendiente"
    EN_PROGRESO = "en_progreso"
    EN_PRUEBAS = "en_pruebas"
    FINALIZADO = "finalizado"
    PAUSADO = "pausado"
    CANCELADO = "cancelado"


class TaskStatus(str, enum.Enum):
    PENDIENTE = "pendiente"
    EN_PROCESO = "en_proceso"
    EN_PRUEBAS = "en_pruebas"
    FINALIZADO = "finalizado"
    PAUSADO = "pausado"
    CANCELADO = "cancelado"


class TaskPriority(str, enum.Enum):
    BAJA = "baja"
    MEDIA = "media"
    ALTA = "alta"
    URGENTE = "urgente"
    CRITICA = "critica"


class InventoryCategory(str, enum.Enum):
    ARDUINO = "arduino"
    ESP32 = "esp32"
    MOTORES = "motores"
    SERVOMOTORES = "servomotores"
    SENSORES = "sensores"
    BATERIAS = "baterias"
    CAMARAS = "camaras"
    IMPRESIONES_3D = "impresiones_3d"
    HERRAMIENTAS = "herramientas"
    CONSUMIBLES = "consumibles"
    OTROS = "otros"


class FinancialType(str, enum.Enum):
    INGRESO = "ingreso"
    EGRESO = "egreso"
    COMPRA = "compra"
    VENTA = "venta"


class InvoiceStatus(str, enum.Enum):
    PENDIENTE = "pendiente"
    PAGADA = "pagada"
    PARCIAL = "parcial"
    VENCIDA = "vencida"
    ANULADA = "anulada"


class QuoteStatus(str, enum.Enum):
    BORRADOR = "borrador"
    ENVIADA = "enviada"
    APROBADA = "aprobada"
    RECHAZADA = "rechazada"
    VENCIDA = "vencida"


class LabStatus(str, enum.Enum):
    OPERATIVO = "operativo"
    MANTENIMIENTO = "mantenimiento"
    OCUPADO = "ocupado"
    DISPONIBLE = "disponible"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="programador", nullable=False)
    phone = Column(String(50))
    avatar_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    two_factor_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))

    developer = relationship("Developer", back_populates="user", uselist=False)
    client = relationship("Client", back_populates="user", uselist=False)
    assigned_tasks = relationship("Task", foreign_keys="Task.assigned_to_id", back_populates="assigned_to")
    created_tasks = relationship("Task", foreign_keys="Task.created_by_id", back_populates="created_by")
    created_projects = relationship("Project", back_populates="created_by")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    notifications = relationship("Notification", back_populates="user")
    activity_logs = relationship("ActivityLog", back_populates="user")


class Developer(Base):
    __tablename__ = "developers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    photo_url = Column(String(500))
    position = Column(String(150), nullable=False)
    specialty = Column(String(250))
    availability = Column(SQLEnum(DeveloperAvailability), default=DeveloperAvailability.DISPONIBLE)
    status = Column(SQLEnum(DeveloperStatus), default=DeveloperStatus.ACTIVO)
    hours_worked = Column(Float, default=0.0)
    performance_score = Column(Float, default=0.0)
    compliance_percentage = Column(Float, default=0.0)
    bio = Column(Text)
    skills = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="developer")
    projects = relationship("ProjectDeveloper", back_populates="developer")


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    company_name = Column(String(255))
    nit = Column(String(50))
    address = Column(String(500))
    contact_name = Column(String(255))
    contact_phone = Column(String(50))
    credit_limit = Column(Float, default=0.0)
    current_balance = Column(Float, default=0.0)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="client")
    projects = relationship("Project", back_populates="client")
    invoices = relationship("Invoice", back_populates="client")
    quotes = relationship("Quote", back_populates="client")
    payments = relationship("Payment", back_populates="client")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    description = Column(Text)
    budget_value = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    profit_margin = Column(Float, default=0.0)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.PENDIENTE)
    progress_percentage = Column(Float, default=0.0)
    lab_id = Column(Integer, ForeignKey("labs.id"))
    created_by_id = Column(Integer, ForeignKey("users.id"))
    files = Column(JSON, default=list)
    blueprints = Column(JSON, default=list)
    models_3d = Column(JSON, default=list)
    materials_list = Column(JSON, default=list)
    schedule = Column(JSON, default=dict)
    history = Column(JSON, default=list)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    client = relationship("Client", back_populates="projects")
    created_by = relationship("User", back_populates="created_projects")
    lab = relationship("Lab", back_populates="projects", foreign_keys=[lab_id])
    developers = relationship("ProjectDeveloper", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="project")
    quotes = relationship("Quote", back_populates="project")


class ProjectDeveloper(Base):
    __tablename__ = "project_developers"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    developer_id = Column(Integer, ForeignKey("developers.id"), nullable=False)
    role_in_project = Column(String(150))
    hours_allocated = Column(Float, default=0.0)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="developers")
    developer = relationship("Developer", back_populates="projects")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    project_id = Column(Integer, ForeignKey("projects.id"))
    assigned_to_id = Column(Integer, ForeignKey("users.id"))
    created_by_id = Column(Integer, ForeignKey("users.id"))
    priority = Column(SQLEnum(TaskPriority), default=TaskPriority.MEDIA)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDIENTE)
    progress_percentage = Column(Float, default=0.0)
    start_date = Column(Date)
    due_date = Column(Date)
    estimated_hours = Column(Float, default=0.0)
    actual_hours = Column(Float, default=0.0)
    attachments = Column(JSON, default=list)
    blueprints = Column(JSON, default=list)
    code_links = Column(JSON, default=list)
    comments = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="tasks")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_tasks")
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="created_tasks")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(SQLEnum(InventoryCategory), default=InventoryCategory.OTROS)
    description = Column(Text)
    sku = Column(String(100), unique=True, index=True)
    quantity = Column(Integer, default=0)
    min_stock = Column(Integer, default=5)
    unit_cost = Column(Float, default=0.0)
    supplier = Column(String(255))
    supplier_contact = Column(String(255))
    location = Column(String(255))
    qr_code = Column(String(500))
    barcode = Column(String(500))
    image_url = Column(String(500))
    specs = Column(JSON, default=dict)
    low_stock_alert = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    movements = relationship("InventoryMovement", back_populates="item", cascade="all, delete-orphan")


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    type = Column(String(50), nullable=False)  # "entrada" | "salida"
    quantity = Column(Integer, nullable=False)
    reference = Column(String(255))
    notes = Column(String(500))
    user_id = Column(Integer, ForeignKey("users.id"))
    user_name = Column(String(255))   # captura nombre al momento del movimiento
    user_role = Column(String(100))   # captura rol al momento del movimiento
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    item = relationship("InventoryItem", back_populates="movements")


class FinancialRecord(Base):
    __tablename__ = "financial_records"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(SQLEnum(FinancialType), nullable=False)
    description = Column(String(500), nullable=False)
    amount = Column(Float, default=0.0)
    date = Column(Date, nullable=False)
    category = Column(String(150))
    reference = Column(String(255))
    payment_method = Column(String(100))
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    date = Column(Date, nullable=False)
    due_date = Column(Date)
    subtotal = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.PENDIENTE)
    notes = Column(Text)
    items = Column(JSON, default=list)
    pdf_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    client = relationship("Client", back_populates="invoices")
    project = relationship("Project", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(String(50), unique=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    amount = Column(Float, default=0.0)
    date = Column(Date, nullable=False)
    method = Column(String(100))
    reference = Column(String(255))
    notes = Column(Text)
    pdf_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    invoice = relationship("Invoice", back_populates="payments")
    client = relationship("Client", back_populates="payments")


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    quote_number = Column(String(50), unique=True, index=True, nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    title = Column(String(255))
    date = Column(Date, nullable=False)
    valid_until = Column(Date)
    subtotal = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    status = Column(SQLEnum(QuoteStatus), default=QuoteStatus.BORRADOR)
    notes = Column(Text)
    terms = Column(Text)
    items = Column(JSON, default=list)
    logo_url = Column(String(500))
    signature_url = Column(String(500))
    qr_code = Column(String(500))
    pdf_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    client = relationship("Client", back_populates="quotes")
    project = relationship("Project", back_populates="quotes")


class Lab(Base):
    __tablename__ = "labs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    code = Column(String(50), unique=True, index=True)
    location = Column(String(300))
    description = Column(Text)
    status = Column(SQLEnum(LabStatus), default=LabStatus.DISPONIBLE)
    current_project_id = Column(Integer, ForeignKey("projects.id"))
    equipment = Column(JSON, default=list)
    capacity = Column(Integer, default=10)
    image_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    projects = relationship("Project", back_populates="lab", foreign_keys=[Project.lab_id])


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String(50), default="text")
    attachment_url = Column(String(500))
    code_snippet = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(String(1000))
    type = Column(String(100))
    related_id = Column(Integer)
    related_type = Column(String(100))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="notifications")


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    event_type = Column(String(100))
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime = Column(DateTime(timezone=True), nullable=False)
    all_day = Column(Boolean, default=False)
    location = Column(String(300))
    user_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    attendees = Column(JSON, default=list)
    reminder_minutes = Column(Integer, default=30)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(200), nullable=False)
    entity_type = Column(String(100))
    entity_id = Column(Integer)
    details = Column(JSON, default=dict)
    ip_address = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="activity_logs")
