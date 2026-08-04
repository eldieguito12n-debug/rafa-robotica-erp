import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(".env.vercel.prod")

url = os.environ.get("POSTGRES_URL") or os.environ.get("DATABASE_URL")
if not url:
    print("No DATABASE_URL found")
    sys.exit(1)

if url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql://", 1)

print(f"Connecting to database...")
engine = create_engine(url)

commands = [
    "ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);",
    "ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS user_role VARCHAR(100);",
    "ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id);"
]

with engine.connect() as conn:
    for cmd in commands:
        try:
            conn.execute(text(cmd))
            print(f"Executed: {cmd}")
        except Exception as e:
            print(f"Error executing {cmd}: {e}")
    conn.commit()
    
    # Check notifications table
    print("Checking if notifications table exists...")
    try:
        conn.execute(text("SELECT id FROM notifications LIMIT 1"))
        print("notifications table exists.")
    except Exception as e:
        print("Creating notifications table...")
        # Since transaction might be aborted in Postgres, we have to reconnect or rollback
        pass

# Let's import the Base and create missing tables using SQLAlchemy
print("Creating missing tables...")
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.models import Base
Base.metadata.create_all(bind=engine)
print("Finished!")
