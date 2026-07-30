import requests
session = requests.Session()

# Login
r = session.post("http://localhost:8000/api/v1/auth/login", data={"username": "rafa@gmail.com", "password": "password123"})
print("Login:", r.status_code, r.text)
if r.status_code == 200:
    token = r.json()["access_token"]
    
    # Create task
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": "Test Task",
        "project_id": 1,
        "priority": "alta",
        "status": "pendiente",
        "estimated_hours": 8
    }
    r2 = session.post("http://localhost:8000/api/v1/tasks", json=data, headers=headers)
    print("Create:", r2.status_code, r2.text)
