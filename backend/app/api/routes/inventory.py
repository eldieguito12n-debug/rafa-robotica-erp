from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from io import BytesIO
from ...core.database import get_db
from ...core.security import get_current_user, require_roles, require_admin, is_admin
from ...core.activity_middleware import log_activity
from ...core.qr_code import generate_qr_bytes
from ...models import InventoryItem, InventoryMovement, User
from ...schemas import InventoryItem as InventorySchema, InventoryItemCreate, InventoryItemUpdate

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
    item = InventoryItem(**data.model_dump())
    item.low_stock_alert = item.quantity <= item.min_stock
    db.add(item)
    db.flush()
    log_activity(db, current_user.id, "crear", "inventory_item", item.id, data.model_dump())
    db.commit()
    db.refresh(item)
    return item


@router.get("/inventory/{item_id}", response_model=InventorySchema)
def get_inventory_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")
    return item


@router.get("/inventory/{item_id}/qr")
def download_inventory_qr(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")
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
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    item.low_stock_alert = item.quantity <= item.min_stock
    db.flush()
    log_activity(db, current_user.id, "actualizar", "inventory_item", item.id, data.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(item)
    return item


@router.post("/inventory/{item_id}/move")
def move_inventory(
    item_id: int,
    movement_type: str = Query(..., description="entrada or salida"),
    quantity: int = Query(..., gt=0),
    reference: Optional[str] = None,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")

    if not is_admin(current_user):
        if movement_type != "salida":
            raise HTTPException(403, "Solo los administradores pueden registrar entradas")

    if movement_type == "salida" and item.quantity < quantity:
        raise HTTPException(400, "Not enough stock")
    if movement_type == "entrada":
        item.quantity += quantity
    else:
        item.quantity -= quantity
    item.low_stock_alert = item.quantity <= item.min_stock
    mv = InventoryMovement(item_id=item_id, type=movement_type, quantity=quantity, reference=reference, notes=notes, user_id=current_user.id)
    db.add(mv)
    db.flush()
    log_activity(db, current_user.id, "actualizar", "inventory_item", item.id, {"movement_type": movement_type, "quantity": quantity, "reference": reference})
    db.commit()
    return {"message": "Movement registered", "new_quantity": item.quantity}


@router.delete("/inventory/{item_id}")
def delete_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")
    log_activity(db, current_user.id, "eliminar", "inventory_item", item.id, {"name": item.name, "sku": item.sku})
    db.delete(item)
    db.commit()
    return {"message": "Item deleted"}


@router.get("/inventory-alerts")
def get_inventory_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    low = db.query(InventoryItem).filter(InventoryItem.quantity <= InventoryItem.min_stock).all()
    return {
        "total_alerts": len(low),
        "items": [
            {"id": i.id, "name": i.name, "sku": i.sku, "quantity": i.quantity, "min_stock": i.min_stock, "category": i.category.value if hasattr(i.category, 'value') else str(i.category)}
            for i in low
        ],
    }
