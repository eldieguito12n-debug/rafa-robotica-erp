import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from mangum import Mangum
except ImportError:
    raise RuntimeError("Instala Mangum: pip install mangum   -> requerido para FastAPI serverless en Vercel")

from app.main import app

handler = Mangum(app, lifespan="off")
