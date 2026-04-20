import requests
from bs4 import BeautifulSoup
import json
import re

def test_riseq():
    url = "https://riseq.seismo.gov.in/riseq/earthquake"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    print(f"Fetching {url}...")
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            items = soup.find_all('li', class_='event_list')
            print(f"Found {len(items)} items.")
            
            for i, li in enumerate(items[:5]):
                data_json = li.get('data-json')
                if data_json:
                    data = json.loads(data_json)
                    print(f"\nItem {i+1}:")
                    print(f"  Name: {data.get('event_name')}")
                    print(f"  Time: {data.get('origin_time')}")
                    print(f"  Coords: {data.get('lat_long')}")
                    
                    # Test cleaning logic
                    raw_place = data.get('event_name', 'India Region')
                    clean_place = raw_place.split(' - ')[-1].strip() if ' - ' in raw_place else raw_place
                    print(f"  Cleaned Place: {clean_place}")
        else:
            print("Failed to fetch.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_riseq()
