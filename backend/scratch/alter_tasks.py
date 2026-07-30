import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('.env.production')

url = os.environ.get('POSTGRES_URL_NON_POOLING')

conn = psycopg2.connect(url)
cur = conn.cursor()

try:
    cur.execute("ALTER TABLE tasks ADD COLUMN start_date DATE;")
    conn.commit()
    print("Added start_date")
except Exception as e:
    conn.rollback()
    print("Error adding start_date:", e)

try:
    cur.execute("ALTER TABLE tasks ADD COLUMN due_date DATE;")
    conn.commit()
    print("Added due_date")
except Exception as e:
    conn.rollback()
    print("Error adding due_date:", e)

cur.close()
conn.close()
