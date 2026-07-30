import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('.env.production')
url = os.environ.get('POSTGRES_URL_NON_POOLING')

conn = psycopg2.connect(url)
cur = conn.cursor()

try:
    cur.execute("SELECT unnest(enum_range(NULL::userrole))")
    print("UserRole enum values in DB:")
    for row in cur.fetchall():
        print(row[0])
except Exception as e:
    print("Error:", e)

cur.close()
conn.close()
