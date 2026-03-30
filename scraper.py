import urllib.request
import json
from html.parser import HTMLParser
import re

class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_table = False
        self.in_row = False
        self.in_cell = False
        self.in_header = False
        
        self.tables = []
        self.current_table = []
        self.current_row = []
        self.current_cell = []
        
        self.current_header_text = []
        self.last_header = "General"

    def handle_starttag(self, tag, attrs):
        if tag in ('h2', 'h3'):
            self.in_header = True
            self.current_header_text = []
        elif tag == 'table':
            self.in_table = True
            self.current_table = []
        elif tag == 'tr' and self.in_table:
            self.in_row = True
            self.current_row = []
        elif tag in ('td', 'th') and self.in_row:
            self.in_cell = True
            self.current_cell = []

    def handle_data(self, data):
        if self.in_header:
            text = data.strip()
            if text:
                self.current_header_text.append(text)
        elif self.in_cell:
            text = data.strip()
            if text:
                self.current_cell.append(text)

    def handle_endtag(self, tag):
        if tag in ('h2', 'h3'):
            self.in_header = False
            if self.current_header_text:
                self.last_header = ' '.join(self.current_header_text).strip()
        elif tag == 'table':
            self.in_table = False
            if self.current_table:
                valid_rows = [r for r in self.current_table if len(r) > 1]
                if valid_rows:
                    self.tables.append({
                        "section": self.last_header,
                        "rows": valid_rows
                    })
        elif tag == 'tr' and self.in_table:
            self.in_row = False
            if self.current_row:
                self.current_table.append(self.current_row)
        elif tag in ('td', 'th') and self.in_row:
            self.in_cell = False
            cell_text = ' '.join(self.current_cell).replace("  ", " ").strip()
            if 'done' in cell_text.split():
                cell_text = 'Included'
            elif 'close' in cell_text.split() and len(cell_text.split()) == 1:
                cell_text = 'Not included'
            self.current_row.append(cell_text)

def fetch_tables(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
    parser = TableParser()
    parser.feed(html)
    return parser.tables

essentials_url = "https://knowledge.workspace.google.com/admin/getting-started/editions/compare-essentials-editions"
frontline_url = "https://knowledge.workspace.google.com/admin/getting-started/editions/compare-frontline-editions"

print("Fetching Essentials...")
e_tables = fetch_tables(essentials_url)
print("Fetching Frontline...")
f_tables = fetch_tables(frontline_url)

with open('data.json', 'w') as f:
    json.dump({"essentials": e_tables, "frontline": f_tables}, f, indent=2)
print(f"Done. Wrote data.json with {len(e_tables)} essentials tables and {len(f_tables)} frontline tables")
