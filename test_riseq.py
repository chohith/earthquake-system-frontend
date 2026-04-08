import requests
from bs4 import BeautifulSoup
import json

url = "https://riseq.seismo.gov.in/riseq/earthquake"
# Bypass potential blocking by using a standard User-Agent
response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
soup = BeautifulSoup(response.text, 'html.parser')

table = soup.find('table')
if not table:
    print("No table found.")
else:
    headers = [th.text.strip() for th in table.find_all('th')]
    print("Headers:", headers)
    for index, tr in enumerate(table.find_all('tr')[1:5]):
        cols = [td.text.strip() for td in tr.find_all('td')]
        print(f"Row {index}:", cols)
