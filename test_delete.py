import sys
import os

sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.database import SessionLocal
from app.models import User, Developer, Task, Client, Project, Message, Notification, ActivityLog, FinancialRecord, InventoryMovement, ProjectDeveloper

def test():
    db = SessionLocal()
    dev = db.query(Developer).first()
    if not dev:
        print("No developer found")
        return
    user_id = dev.user_id
    user = db.query(User).get(user_id)
    print(f"Trying to delete user {user_id} - {user.full_name}")
    
    try:
        db.query(Task).filter(Task.assigned_to_id == user.id).update({Task.assigned_to_id: None})
        db.query(Task).filter(Task.created_by_id == user.id).update({Task.created_by_id: None})
        db.query(Project).filter(Project.created_by_id == user.id).update({Project.created_by_id: None})
        db.query(FinancialRecord).filter(FinancialRecord.user_id == user.id).update({FinancialRecord.user_id: None})
        db.query(InventoryMovement).filter(InventoryMovement.user_id == user.id).update({InventoryMovement.user_id: None})
        
        if dev:
            db.query(ProjectDeveloper).filter(ProjectDeveloper.developer_id == dev.id).delete()
            db.delete(dev)
            
        db.query(Client).filter(Client.user_id == user.id).delete()
        db.query(Message).filter((Message.sender_id == user.id) | (Message.receiver_id == user.id)).delete(synchronize_session=False)
        db.query(Notification).filter(Notification.user_id == user.id).delete()
        db.query(ActivityLog).filter(ActivityLog.user_id == user.id).delete()
        
        db.flush()
        db.delete(user)
        db.commit()
        print("Success")
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.rollback()

if __name__ == '__main__':
    test()
