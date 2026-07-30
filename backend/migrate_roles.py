
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(".env.production")
database_url = os.getenv("DATABASE_URL")
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

if "?" in database_url:
    database_url = database_url.split("?")[0]

engine = create_engine(database_url)

def migrate():
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        try:
            print("Changing role column to varchar...")
            conn.execute(text("ALTER TABLE users ALTER COLUMN role TYPE varchar(50) USING role::varchar;"))
            print("Dropping userrole type if exists...")
            conn.execute(text("DROP TYPE IF EXISTS userrole CASCADE;"))
            print("Migration successful.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    migrate()

