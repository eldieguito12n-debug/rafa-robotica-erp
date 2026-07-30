import requests

session = requests.Session()
r = session.post("https://backend-six-omega-27.vercel.app/api/v1/auth/login", data={"username": "admin@robolab.com", "password": "admin123"})
if r.status_code == 200:
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    r2 = session.get("https://backend-six-omega-27.vercel.app/api/v1/tasks", headers=headers)
    print("Tasks status:", r2.status_code)
    print("Tasks text:", r2.text)
else:
    print("Login failed")
