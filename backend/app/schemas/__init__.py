from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from .. import models


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str = "programador"  # string libre — permite roles personalizados


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None   # string libre
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None


class User(UserBase):
    id: int
    is_active: bool
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


class DeveloperBase(BaseModel):
    position: str
    specialty: Optional[str] = None
    availability: models.DeveloperAvailability = models.DeveloperAvailability.DISPONIBLE
    status: models.DeveloperStatus = models.DeveloperStatus.ACTIVO
    bio: Optional[str] = None
    skills: Optional[List[str]] = []


class DeveloperCreate(DeveloperBase):
    user_id: int


class Developer(DeveloperBase):
    id: int
    user_id: int
    hours_worked: float = 0.0
    performance_score: float = 0.0
    compliance_percentage: float = 0.0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClientBase(BaseModel):
    company_name: Optional[str] = None
    nit: Optional[str] = None
    address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    credit_limit: float = 0.0
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    user_id: int


class ClientUpdate(BaseModel):
    company_name: Optional[str] = None
    nit: Optional[str] = None
    address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    credit_limit: Optional[float] = None
    current_balance: Optional[float] = None
    notes: Optional[str] = None


class Client(ClientBase):
    id: int
    user_id: int
    current_balance: float = 0.0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: models.TaskPriority = models.TaskPriority.MEDIA
    status: models.TaskStatus = models.TaskStatus.PENDIENTE
    progress_percentage: float = 0.0
    due_date: Optional[date] = None
    estimated_hours: float = 0.0


class TaskCreate(TaskBase):
    project_id: Optional[int] = None
    assigned_to_id: Optional[int] = None
    created_by_id: Optional[int] = None
    start_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[models.TaskPriority] = None
    status: Optional[models.TaskStatus] = None
    progress_percentage: Optional[float] = None
    due_date: Optional[date] = None
    assigned_to_id: Optional[int] = None
    actual_hours: Optional[float] = None
    comments: Optional[List[Dict[str, Any]]] = None


class Task(TaskBase):
    id: int
    project_id: Optional[int] = None
    assigned_to_id: Optional[int] = None
    created_by_id: int
    start_date: Optional[date] = None
    actual_hours: float = 0.0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    budget_value: float = 0.0
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: models.ProjectStatus = models.ProjectStatus.PENDIENTE
    lab_id: Optional[int] = None
    notes: Optional[str] = None


class ProjectCreate(ProjectBase):
    client_id: Optional[int] = None
    created_by_id: int


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    budget_value: Optional[float] = None
    actual_cost: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[models.ProjectStatus] = None
    progress_percentage: Optional[float] = None
    client_id: Optional[int] = None
    lab_id: Optional[int] = None


class Project(ProjectBase):
    id: int
    client_id: Optional[int] = None
    created_by_id: int
    actual_cost: float = 0.0
    profit_margin: float = 0.0
    progress_percentage: float = 0.0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProjectDeveloperCreate(BaseModel):
    project_id: int
    developer_id: int
    role_in_project: Optional[str] = None
    hours_allocated: float = 0.0


class InventoryItemBase(BaseModel):
    name: str
    category: models.InventoryCategory = models.InventoryCategory.OTROS
    description: Optional[str] = None
    sku: Optional[str] = None
    quantity: int = 0
    min_stock: int = 5
    unit_cost: float = 0.0
    supplier: Optional[str] = None
    location: Optional[str] = None


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[models.InventoryCategory] = None
    description: Optional[str] = None
    quantity: Optional[int] = None
    min_stock: Optional[int] = None
    unit_cost: Optional[float] = None
    supplier: Optional[str] = None
    low_stock_alert: Optional[bool] = None


class InventoryItem(InventoryItemBase):
    id: int
    low_stock_alert: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InventoryMovementOut(BaseModel):
    """Schema de salida para historial de movimientos de inventario."""
    id: int
    item_id: int
    item_name: Optional[str] = None
    type: str  # "entrada" | "salida"
    quantity: int
    reference: Optional[str] = None
    notes: Optional[str] = None
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    user_role: Optional[str] = None
    project_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FinancialRecordBase(BaseModel):
    type: models.FinancialType
    description: str
    amount: float
    date: date
    category: Optional[str] = None
    reference: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class FinancialRecordCreate(FinancialRecordBase):
    invoice_id: Optional[int] = None
    user_id: Optional[int] = None


class FinancialRecord(FinancialRecordBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    date: date
    due_date: Optional[date] = None
    subtotal: float = 0.0
    tax: float = 0.0
    discount: float = 0.0
    total: float = 0.0
    status: models.InvoiceStatus = models.InvoiceStatus.PENDIENTE
    notes: Optional[str] = None
    items: List[Dict[str, Any]] = []


class InvoiceCreate(InvoiceBase):
    invoice_number: str
    client_id: Optional[int] = None
    project_id: Optional[int] = None


class Invoice(InvoiceBase):
    id: int
    invoice_number: str
    client_id: Optional[int] = None
    project_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaymentBase(BaseModel):
    amount: float
    date: date
    method: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    receipt_number: str
    invoice_id: int
    client_id: int


class Payment(PaymentBase):
    id: int
    receipt_number: Optional[str] = None
    invoice_id: Optional[int] = None
    client_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class QuoteBase(BaseModel):
    title: Optional[str] = None
    date: date
    valid_until: Optional[date] = None
    subtotal: float = 0.0
    tax: float = 0.0
    discount: float = 0.0
    total: float = 0.0
    status: models.QuoteStatus = models.QuoteStatus.BORRADOR
    notes: Optional[str] = None
    terms: Optional[str] = None
    items: List[Dict[str, Any]] = []


class QuoteCreate(QuoteBase):
    quote_number: str
    client_id: Optional[int] = None
    project_id: Optional[int] = None


class Quote(QuoteBase):
    id: int
    quote_number: str
    client_id: Optional[int] = None
    project_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MessageBase(BaseModel):
    receiver_id: int
    content: str
    message_type: str = "text"
    attachment_url: Optional[str] = None
    code_snippet: Optional[str] = None


class MessageCreate(MessageBase):
    sender_id: int


class Message(MessageBase):
    id: int
    sender_id: int
    is_read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationBase(BaseModel):
    title: str
    message: Optional[str] = None
    type: Optional[str] = None
    related_id: Optional[int] = None
    related_type: Optional[str] = None


class NotificationCreate(NotificationBase):
    user_id: int


class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CalendarEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_datetime: datetime
    end_datetime: datetime
    all_day: bool = False
    location: Optional[str] = None
    reminder_minutes: int = 30


class CalendarEventCreate(CalendarEventBase):
    user_id: Optional[int] = None
    project_id: Optional[int] = None
    attendees: List[int] = []


class CalendarEvent(CalendarEventBase):
    id: int
    user_id: Optional[int] = None
    project_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    all_day: Optional[bool] = None
    location: Optional[str] = None
    reminder_minutes: Optional[int] = None
    project_id: Optional[int] = None
    attendees: Optional[List[int]] = None


class LabBase(BaseModel):
    name: str
    code: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    status: models.LabStatus = models.LabStatus.DISPONIBLE
    capacity: int = 10


class LabCreate(LabBase):
    pass


class LabUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    status: Optional[models.LabStatus] = None
    capacity: Optional[int] = None
    equipment: Optional[List[Dict[str, Any]]] = None
    image_url: Optional[str] = None


class Lab(LabBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DeveloperUpdate(BaseModel):
    position: Optional[str] = None
    specialty: Optional[str] = None
    availability: Optional[models.DeveloperAvailability] = None
    status: Optional[models.DeveloperStatus] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    hours_worked: Optional[float] = None
    performance_score: Optional[float] = None
    compliance_percentage: Optional[float] = None
    photo_url: Optional[str] = None


class DashboardStats(BaseModel):
    active_projects: int = 0
    completed_projects: int = 0
    connected_developers: int = 0
    pending_tasks: int = 0
    hours_worked: float = 0.0
    monthly_sales: float = 0.0
    monthly_expenses: float = 0.0
    monthly_profit: float = 0.0
    new_clients: int = 0
    labs: List[Lab] = []
    recent_activity: List[Dict[str, Any]] = []
    kpis: Dict[str, Any] = {}
