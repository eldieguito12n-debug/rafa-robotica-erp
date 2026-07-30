import requests
import json
import os
from dotenv import load_dotenv

load_dotenv('.env.production')

# Let's try to authenticate using a test user or see what the /tasks endpoint returns
print("Testing API...")
