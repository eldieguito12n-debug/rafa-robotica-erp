import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('.env.production')
url = os.environ.get('POSTGRES_URL_NON_POOLING')

conn = psycopg2.connect(url)
conn.autocommit = True
cur = conn.cursor()

commands = [
    "ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text;",
    "ALTER TABLE developers ALTER COLUMN availability TYPE VARCHAR(50) USING availability::text;",
    "ALTER TABLE developers ALTER COLUMN status TYPE VARCHAR(50) USING status::text;",
    "ALTER TABLE projects ALTER COLUMN status TYPE VARCHAR(50) USING status::text;",
    "ALTER TABLE tasks ALTER COLUMN status TYPE VARCHAR(50) USING status::text;",
    "ALTER TABLE tasks ALTER COLUMN priority TYPE VARCHAR(50) USING priority::text;"
]

for cmd in commands:
    try:
        cur.execute(cmd)
        print("Success:", cmd)
    except Exception as e:
        print("Error with:", cmd, "->", e)

cur.close()
conn.close()
