import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from app.main import app

def test_api():
    client = TestClient(app)
    
    # We can override the dependency to bypass auth
    from app.core.security import get_current_user, require_admin
    from app.models import User
    
    def override_require_admin():
        return User(id=3, role="administrador", email="rafa@gmail.com")
        
    app.dependency_overrides[require_admin] = override_require_admin
    app.dependency_overrides[get_current_user] = override_require_admin
    
    payload = {
        "name": "API Test Project Omit Budget",
        "description": "",
        "start_date": None,
        "end_date": None,
        "client_id": None,
        "status": "pendiente"
    }
    
    res = client.post("/api/v1/projects", json=payload)
    print("Status:", res.status_code)
    print("Response:", res.json())

if __name__ == "__main__":
    test_api()
