from sqlalchemy import text, create_engine

db_url = "postgresql://default:oPzK48yQdmsL@ep-white-snow-a45g0nd0-pooler.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require"
engine = create_engine(db_url)

def run_migration():
    print("Running migration for tasks module...")
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN approved_by_id INTEGER REFERENCES users(id)"))
            print("Added approved_by_id")
        except Exception as e:
            print(f"Skipped approved_by_id: {e}")
            
        try:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE"))
            print("Added completed_at")
        except Exception as e:
            print(f"Skipped completed_at: {e}")
            
        try:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN total_time_spent FLOAT DEFAULT 0.0"))
            print("Added total_time_spent")
        except Exception as e:
            print(f"Skipped total_time_spent: {e}")
            
        try:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN history JSON DEFAULT '[]'::json"))
            print("Added history")
        except Exception as e:
            print(f"Skipped history: {e}")

if __name__ == "__main__":
    run_migration()
