"""
Migración RBAC — Agrega columnas nuevas a tablas existentes.
Ejecutar UNA sola vez: python migrate_rbac.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "robolab_erp.db")

def column_exists(cursor, table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    cols = [row[1] for row in cursor.fetchall()]
    return column in cols

def run():
    print(f"Conectando a {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    migrations = [
        # Task: agregar start_date
        ("tasks", "start_date", "ALTER TABLE tasks ADD COLUMN start_date DATE"),
        # InventoryMovement: agregar campos del historial enriquecido
        ("inventory_movements", "user_name", "ALTER TABLE inventory_movements ADD COLUMN user_name VARCHAR(255)"),
        ("inventory_movements", "user_role", "ALTER TABLE inventory_movements ADD COLUMN user_role VARCHAR(100)"),
        ("inventory_movements", "project_id", "ALTER TABLE inventory_movements ADD COLUMN project_id INTEGER"),
    ]

    for table, col, sql in migrations:
        if not column_exists(cur, table, col):
            print(f"  >> Anadiendo columna '{col}' a '{table}'...")
            cur.execute(sql)
            print(f"     OK Columna '{col}' anadida.")
        else:
            print(f"  -- Columna '{col}' en '{table}' ya existe, omitiendo.")

    conn.commit()
    conn.close()
    print("\nMigracion completada exitosamente.")

if __name__ == "__main__":
    run()
