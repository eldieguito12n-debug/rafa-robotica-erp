import requests

session = requests.Session()

# Login
r = session.post("https://backend-six-omega-27.vercel.app/api/v1/auth/login", data={"username": "admin@robolab.com", "password": "admin123"})
print("Login:", r.status_code, r.text)
if r.status_code == 200:
    token = r.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    r2 = session.get("https://backend-six-omega-27.vercel.app/api/v1/fix_db", headers=headers)
    print("Fix DB:", r2.status_code, r2.text)
