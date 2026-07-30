import os
from dotenv import load_dotenv
load_dotenv('.env.local')
from app.core.database import SessionLocal
from app.models import Project

def test_insert():
    db = SessionLocal()
    try:
        p = Project(
            name="Test Project",
            description="Test",
            budget_value=100.0,
            status="pendiente",
            created_by_id=3  # assuming user 3 exists (which I saw earlier in the logs)
        )
        db.add(p)
        db.commit()
        print("Success! Inserted project with ID:", p.id)
    except Exception as e:
        print("Error:", type(e).__name__)
        print(e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_insert()
