import sys
sys.path.append(r'c:\Users\Diego\OneDrive\Desktop\RoboLabERP\backend')
from app.core.database import SessionLocal
from sqlalchemy import text
db = SessionLocal()
try:
    res = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='tasks'"))
    columns = [row[0] for row in res]
    print('Columns in DB tasks table:', columns)
except Exception as e:
    print('Error:', e)
