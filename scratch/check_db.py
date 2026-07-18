import os
import re
import urllib.request
import json

# Read credentials from .env.local
url = None
key = None

try:
    with open(".env.local", "r") as f:
        content = f.read()
        m_url = re.search(r"VITE_SUPABASE_URL\s*=\s*([^\s]+)", content)
        m_key = re.search(r"VITE_SUPABASE_ANON_KEY\s*=\s*([^\s]+)", content)
        if m_url:
            url = m_url.group(1).strip().strip('"').strip("'")
        if m_key:
            key = m_key.group(1).strip().strip('"').strip("'")
except Exception as e:
    print("Error reading .env.local:", e)

if not url or not key:
    print("Could not find Supabase URL or Anon Key")
    exit(1)

req_url = f"{url}/rest/v1/vendors?limit=1"
req = urllib.request.Request(
    req_url,
    headers={
        "apikey": key,
        "Authorization": f"Bearer {key}"
    }
)

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        if data:
            print("Success! Vendor columns:", list(data[0].keys()))
            print("Sample data:", data[0])
        else:
            print("Vendors table is empty.")
except Exception as e:
    print("Error querying database:")
    if hasattr(e, 'read'):
        print(e.read().decode())
    else:
        print(e)

