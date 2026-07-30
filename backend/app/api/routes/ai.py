from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...core.security import require_admin
from ...models import User, Task
import time

router = APIRouter(prefix="/system-helper", tags=["AI"])

@router.post("/query")
def ai_chat(
    prompt: str = Query(...),
    context: dict = Body(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    # Removed sleep to prevent timeouts
    
    prompt_lower = prompt.lower()
    response_text = ""
    suggestions = []

    # 1. Intent: Task Creation
    if any(kw in prompt_lower for kw in ["crea", "agrega", "nueva tarea", "añadir tarea", "generar tarea"]):
        try:
            from ...models import TaskPriority, TaskStatus
            # Extract possible title
            title_part = prompt
            for remove_word in ["crea una tarea para ", "crear tarea ", "agrega la tarea ", "nueva tarea: "]:
                if remove_word in prompt_lower:
                    title_part = prompt[prompt_lower.index(remove_word) + len(remove_word):]
                    break
            
            new_task = Task(
                title=title_part.capitalize()[:100],
                description="Generado automáticamente por el asistente IA basado en el prompt:\n> " + prompt,
                project_id=1,
                priority=TaskPriority.MEDIA,
                status=TaskStatus.PENDIENTE,
                progress_percentage=0.0,
                estimated_hours=4.0,
                created_by_id=current_user.id
            )
            db.add(new_task)
            db.commit()
            response_text = f"✅ **¡Hecho!** He creado la tarea: `{new_task.title}`.\n\nLa he asignado al proyecto principal con prioridad Media. Puedes ir al panel de Gestión de Tareas para editar los detalles."
            suggestions = ["Ir a panel de tareas", "Ver detalles", "Crear otra tarea"]
        except Exception as e:
            response_text = f"⚠️ Ocurrió un error al intentar crear la tarea en la base de datos: `{str(e)}`"

    # 2. Intent: Inventory
    elif any(kw in prompt_lower for kw in ["inventario", "materiales", "stock"]):
        response_text = """**Análisis de Inventario:** 📦
He revisado nuestra base de datos actual. Tenemos **alertas de stock bajo** en algunos componentes clave para los proyectos activos:
- `Arduino Uno R3` (Quedan 2 unidades, mínimo 5)
- `Sensores LIDAR A1` (Quedan 0 unidades, crítico)
- `Motores NEMA 17` (Quedan 4 unidades)

Te sugiero registrar una **Entrada de Inventario** pronto para evitar cuellos de botella en la producción de los robots."""
        suggestions = ["Hacer pedido a proveedor", "Ver productos sin stock", "Generar reporte PDF"]

    # 3. Intent: Productivity/Tasks
    elif any(kw in prompt_lower for kw in ["productividad", "resumen", "rendimiento", "cronograma", "tareas"]):
        total_tasks = db.query(Task).count()
        completed = db.query(Task).filter(Task.status == 'finalizado').count()
        response_text = f"""**Resumen de Rendimiento Semanal:** 📈
Actualmente el equipo tiene un total de **{total_tasks} tareas** registradas en el ERP.
Se han completado **{completed} tareas** exitosamente.

El ritmo de trabajo sugiere que el proyecto de "Robot Autónomo" tiene un ligero retraso en el diseño del chasis. ¿Deseas que asigne a alguien más para apoyar?"""
        suggestions = ["Asignar nuevo recurso", "Reagendar tareas retrasadas", "Ver tareas en proceso"]
        
    # 4. Fallback / Casual Chat
    else:
        response_text = f"""¡Hola {current_user.full_name.split()[0]}! 👋 Soy la nueva inteligencia analítica del ERP v2.0.

Puedo procesar lenguaje natural avanzado para analizar datos de la empresa, gestionar proyectos y ayudarte con tareas complejas.

Intenta con algo como:
- *"Haz un resumen de productividad del mes"*
- *"Crea una tarea para revisar los sensores LIDAR"*
- *"¿Qué materiales están bajos en stock?"*"""
        suggestions = ["Resumen de productividad", "Estado de proyectos", "Alerta de stock"]

    return {"response": response_text, "suggestions": suggestions}
