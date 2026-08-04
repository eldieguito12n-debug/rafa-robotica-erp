from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from io import BytesIO
from ...core.database import get_db
from ...core.security import get_current_user, require_admin, is_admin
from ...core.activity_middleware import log_activity
from ...core.qr_code import generate_qr_bytes
from ...models import InventoryItem, InventoryMovement, User
from ...schemas import (
    InventoryItem as InventorySchema,
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryMovementOut,
)

router = APIRouter(tags=["Inventory"])


@router.get("/inventory", response_model=List[InventorySchema])
def list_inventory(
    category: Optional[str] = None,
    low_stock: bool = False,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Todos los usuarios autenticados pueden ver el inventario."""
    q = db.query(InventoryItem)
    if category:
        q = q.filter(InventoryItem.category == category)
    if low_stock:
        q = q.filter(InventoryItem.quantity <= InventoryItem.min_stock)
    if search:
        q = q.filter((InventoryItem.name.ilike(f"%{search}%")) | (InventoryItem.sku.ilike(f"%{search}%")))
    return q.order_by(InventoryItem.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/inventory", response_model=InventorySchema)
def create_inventory_item(
    data: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Solo Administrador / Jefe de Desarrollo pueden crear productos en el inventario."""
    item_data = data.model_dump()
    if item_data.get('sku') == "":
        item_data['sku'] = None
    item = InventoryItem(**item_data)
    item.low_stock_alert = item.quantity <= item.min_stock
    db.add(item)
    db.flush()
    log_activity(db, current_user.id, "crear", "inventory_item", item.id, data.model_dump(mode='json'))
    db.commit()
    db.refresh(item)
    return item


@router.get("/inventory/{item_id}", response_model=InventorySchema)
def get_inventory_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Artículo no encontrado")
    return item


@router.get("/inventory/{item_id}/qr")
def download_inventory_qr(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Artículo no encontrado")
    code = item.sku or ""
    qr_text = f"{item_id}:{code}:{item.name}"
    qr_bytes = generate_qr_bytes(qr_text, box_size=5)
    filename = f"qr_item_{item_id}.png"
    return StreamingResponse(
        BytesIO(qr_bytes),
        media_type="image/png",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.put("/inventory/{item_id}", response_model=InventorySchema)
def update_inventory_item(
    item_id: int,
    data: InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Solo Administrador / Jefe de Desarrollo pueden editar productos."""
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Artículo no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        if k == 'sku' and v == "":
            v = None
        setattr(item, k, v)
    item.low_stock_alert = item.quantity <= item.min_stock
    db.flush()
    log_activity(db, current_user.id, "actualizar", "inventory_item", item.id, data.model_dump(mode='json', exclude_unset=True))
    db.commit()
    db.refresh(item)
    return item


@router.post("/inventory/{item_id}/move")
def move_inventory(
    item_id: int,
    movement_type: str = Query(..., description="'entrada' o 'salida'"),
    quantity: int = Query(..., gt=0),
    reference: Optional[str] = None,
    notes: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    - 'entrada' (agregar stock): solo Administrador / Jefe de Desarrollo.
    - 'salida' (retirar stock): todos los usuarios autenticados.
    Nunca permite stock negativo.
    """
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Artículo no encontrado")

    if movement_type not in ("entrada", "salida"):
        raise HTTPException(400, "Tipo de movimiento inválido. Use 'entrada' o 'salida'")

    # Solo admins pueden registrar entradas
    if movement_type == "entrada" and not is_admin(current_user):
        raise HTTPException(
            403,
            "Acceso denegado — Solo Administradores pueden agregar existencias al inventario.",
        )

    # Validar stock suficiente para salida
    if movement_type == "salida":
        if item.quantity == 0:
            raise HTTPException(400, "Sin existencias — Este artículo no tiene stock disponible.")
        if item.quantity < quantity:
            raise HTTPException(
                400,
                f"Stock insuficiente. Disponible: {item.quantity} unidad(es).",
            )

    # Aplicar movimiento
    if movement_type == "entrada":
        item.quantity += quantity
    else:
        item.quantity -= quantity

    item.low_stock_alert = item.quantity <= item.min_stock

    # Registrar movimiento en historial con datos enriquecidos
    mv = InventoryMovement(
        item_id=item_id,
        type=movement_type,
        quantity=quantity,
        reference=reference,
        notes=notes,
        user_id=current_user.id,
        user_name=current_user.full_name,
        user_role=current_user.role,
        project_id=project_id,
    )
    db.add(mv)
    db.flush()
    log_activity(
        db, current_user.id, "movimiento_inventario", "inventory_item", item.id,
        {"movement_type": movement_type, "quantity": quantity, "reference": reference, "project_id": project_id},
    )
    
    # Notificar a los administradores si es un retiro (salida)
    if movement_type == "salida":
        from ...models import User, Notification
        from ...core.security import ADMIN_ROLES
        admins = db.query(User).filter(User.role.in_(ADMIN_ROLES)).all()
        for admin in admins:
            if admin.id != current_user.id:
                notif = Notification(
                    user_id=admin.id,
                    title="Retiro de Inventario",
                    message=f"{current_user.full_name} retiró {quantity} u. de '{item.name}'. Motivo: {notes or reference or 'N/A'}",
                    type="inventory_alert",
                    related_id=item.id,
                    related_type="inventory_item"
                )
                db.add(notif)
    
    db.commit()

    stock_msg = "Sin existencias" if item.quantity == 0 else f"{item.quantity} unidad(es)"
    return {
        "message": f"Movimiento de {movement_type} registrado exitosamente",
        "new_quantity": item.quantity,
        "stock_status": stock_msg,
        "low_stock_alert": item.low_stock_alert,
    }


@router.post("/inventory/{item_id}/withdraw")
def withdraw_inventory(
    item_id: int,
    quantity: int = Query(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retirar existencias del inventario"""
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Artículo no encontrado")
    
    if item.quantity < quantity:
        raise HTTPException(
            400,
            f"Stock insuficiente. Disponible: {item.quantity} unidad(es).",
        )

    item.quantity -= quantity
    item.low_stock_alert = item.quantity <= item.min_stock

    mv = InventoryMovement(
        item_id=item_id,
        type="salida",
        quantity=quantity,
        reference="Retiro rápido",
        user_id=current_user.id,
        user_name=current_user.full_name,
        user_role=current_user.role,
    )
    db.add(mv)
    db.flush()
    log_activity(
        db, current_user.id, "movimiento_inventario", "inventory_item", item.id,
        {"movement_type": "salida", "quantity": quantity},
    )
    db.commit()

    return {
        "message": "Retiro registrado exitosamente",
        "new_quantity": item.quantity,
    }


@router.delete("/inventory/{item_id}")
def delete_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Solo Administrador / Jefe de Desarrollo pueden eliminar productos."""
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Artículo no encontrado")
    log_activity(db, current_user.id, "eliminar", "inventory_item", item.id, {"name": item.name, "sku": item.sku})
    try:
        # Explicitly delete related movements to avoid foreign key constraint errors
        db.query(InventoryMovement).filter(InventoryMovement.item_id == item.id).delete(synchronize_session=False)
        
        db.delete(item)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")
    return {"message": "Artículo eliminado"}


@router.get("/inventory-alerts")
def get_inventory_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    low = db.query(InventoryItem).filter(InventoryItem.quantity <= InventoryItem.min_stock).all()
    return {
        "total_alerts": len(low),
        "items": [
            {
                "id": i.id,
                "name": i.name,
                "sku": i.sku,
                "quantity": i.quantity,
                "min_stock": i.min_stock,
                "category": i.category.value if hasattr(i.category, "value") else str(i.category),
                "stock_status": "Sin existencias" if i.quantity == 0 else f"Stock bajo ({i.quantity})",
            }
            for i in low
        ],
    }


@router.get("/inventory-history", response_model=List[InventoryMovementOut])
def get_inventory_history(
    item_id: Optional[int] = None,
    movement_type: Optional[str] = None,
    user_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Historial de movimientos del inventario.
    - Admins ven todo el historial.
    - Usuarios básicos solo ven sus propios movimientos.
    """
    q = db.query(InventoryMovement)

    # Restricción de visibilidad por rol
    if not is_admin(current_user):
        q = q.filter(InventoryMovement.user_id == current_user.id)
    elif user_id:
        q = q.filter(InventoryMovement.user_id == user_id)

    if item_id:
        q = q.filter(InventoryMovement.item_id == item_id)
    if movement_type:
        q = q.filter(InventoryMovement.type == movement_type)
        
    if start_date:
        from datetime import datetime
        try:
            sd = datetime.strptime(start_date, "%Y-%m-%d")
            q = q.filter(InventoryMovement.created_at >= sd)
        except ValueError:
            pass
    if end_date:
        from datetime import datetime, timedelta
        try:
            ed = datetime.strptime(end_date, "%Y-%m-%d")
            q = q.filter(InventoryMovement.created_at < ed + timedelta(days=1))
        except ValueError:
            pass
            
    if search:
        search_term = f"%{search}%"
        q = q.filter(
            (InventoryMovement.user_name.ilike(search_term)) |
            (InventoryMovement.reference.ilike(search_term)) |
            (InventoryMovement.notes.ilike(search_term))
        )

    movements = q.order_by(InventoryMovement.created_at.desc()).offset(skip).limit(limit).all()

    # Enriquecer con nombre del item (join manual)
    result = []
    for mv in movements:
        item_name = mv.item.name if mv.item else None
        result.append(
            InventoryMovementOut(
                id=mv.id,
                item_id=mv.item_id,
                item_name=item_name,
                type=mv.type,
                quantity=mv.quantity,
                reference=mv.reference,
                notes=mv.notes,
                user_id=mv.user_id,
                user_name=mv.user_name,
                user_role=mv.user_role,
                project_id=mv.project_id,
                created_at=mv.created_at,
            )
        )
    return result

@router.get("/inventory/fix-schema")
def fix_inventory_schema(db: Session = Depends(get_db)):
    """Temporal endpoint para agregar columnas faltantes a inventory_movements."""
    from sqlalchemy import text
    try:
        db.execute(text("ALTER TABLE inventory_movements ADD COLUMN user_name VARCHAR(255);"))
        db.commit()
    except Exception:
        db.rollback()
        
    try:
        db.execute(text("ALTER TABLE inventory_movements ADD COLUMN user_role VARCHAR(100);"))
        db.commit()
    except Exception:
        db.rollback()
        
    try:
        db.execute(text("ALTER TABLE inventory_movements ADD COLUMN project_id INTEGER;"))
        db.commit()
    except Exception:
        db.rollback()
        
    try:
        db.execute(text("CREATE TABLE IF NOT EXISTS notifications (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, title VARCHAR(255) NOT NULL, message VARCHAR(1000), type VARCHAR(100), related_id INTEGER, related_type VARCHAR(100), is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);"))
        db.commit()
    except Exception:
        db.rollback()
        
    return {"message": "Schema fix execution finished."}
