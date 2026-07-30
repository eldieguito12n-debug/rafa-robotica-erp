import requests

session = requests.Session()
r = session.post("https://backend-six-omega-27.vercel.app/api/v1/auth/login", data={"username": "admin@robolab.com", "password": "admin123"})
if r.status_code == 200:
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try creating a project
    project_data = {
        "name": "Test Project",
        "description": "Test",
        "budget_value": 1000,
        "actual_cost": 0,
        "profit_margin": 0,
        "status": "pendiente",
        "progress_percentage": 0
    }
    r2 = session.post("https://backend-six-omega-27.vercel.app/api/v1/projects", json=project_data, headers=headers)
    print("Create Project:", r2.status_code, r2.text)
    
    if r2.status_code == 200:
        proj_id = r2.json()["id"]
        
        # Try creating a task
        task_data = {
            "title": "Test Task",
            "project_id": proj_id,
            "priority": "alta",
            "status": "pendiente",
            "estimated_hours": 8
        }
        r3 = session.post("https://backend-six-omega-27.vercel.app/api/v1/tasks", json=task_data, headers=headers)
        print("Create Task:", r3.status_code, r3.text)
else:
    print("Login failed")
