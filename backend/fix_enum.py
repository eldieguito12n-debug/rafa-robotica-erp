import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(".env.production")

db_url = os.environ.get("POSTGRES_URL")
if not db_url:
    print("No POSTGRES_URL found in .env.vercel")
    sys.exit(1)

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)

if "?" in db_url:
    db_url = db_url.split("?")[0]

try:
    engine = create_engine(db_url, isolation_level="AUTOCOMMIT")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TYPE userrole ADD VALUE 'administradora';"))
            print("Successfully added 'administradora' to userrole ENUM.")
        except Exception as e:
            print(f"Error altering ENUM (might already exist): {e}")
except Exception as e:
    print(f"Error connecting to DB: {e}")
