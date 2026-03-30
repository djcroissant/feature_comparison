import json
import re
import os

def clean_text(text):
    text = re.sub(r'[*†\u2020\u2021]+', '', text)
    text = text.replace('\u2714', 'Included')
    if text.lower().strip() == 'done':
        text = 'Included'
    elif text.lower().strip() == 'close':
        text = 'Not included'
    return text.strip()

with open('data.json') as f:
    data = json.load(f)

sections_dict = {}

def process_tables(table_list, target_skus):
    for item in table_list:
        section = clean_text(item.get("section", "General"))
        
        # Normalize log events section names
        sec_low = section.lower()
        if "log event" in sec_low or "log-event" in sec_low:
            section = "Log events of user and admin activity"
            
        table = item.get("rows", [])
        if not table or len(table) < 2: continue
        
        headers = [clean_text(h) for h in table[0]]
        sku_indices = {}
        for sku in target_skus:
            for i, h in enumerate(headers):
                if sku.lower() in h.lower():
                    sku_indices[sku] = i
                    break
                    
        start_row = 1
        if not sku_indices and len(table) > 1:
            h2 = [clean_text(h) for h in table[1]]
            for sku in target_skus:
                for i, h in enumerate(h2):
                    if sku.lower() in h.lower():
                        sku_indices[sku] = i
                        break
            start_row = 2
            
        if not sku_indices:
            continue
            
        if section not in sections_dict:
            sections_dict[section] = {}
            
        for row in table[start_row:]:
            if not row: continue
            feature_name = clean_text(row[0])
            if not feature_name: continue
            
            if feature_name not in sections_dict[section]:
                sections_dict[section][feature_name] = {
                    "Enterprise Essentials": "N/A",
                    "Enterprise Essentials Plus": "N/A",
                    "Frontline Standard": "N/A",
                    "Frontline Plus": "N/A"
                }
                
            for sku, idx in sku_indices.items():
                if idx < len(row):
                    val = clean_text(row[idx])
                    if val == '':
                        sections_dict[section][feature_name][sku] = "Not included"
                    else:
                        sections_dict[section][feature_name][sku] = val
                else:
                    sections_dict[section][feature_name][sku] = "Not included"

process_tables(data['essentials'], ["Enterprise Essentials", "Enterprise Essentials Plus"])
process_tables(data['frontline'], ["Frontline Standard", "Frontline Plus"])

final_list = []
for section_name, features_map in sections_dict.items():
    feature_list = []
    for name, skus in features_map.items():
        if len(name) < 2: continue
        feature_list.append({"feature": name, **skus})
    
    if feature_list:
        # Sort features alphabetically by feature name
        feature_list.sort(key=lambda x: x['feature'].casefold())
        
        final_list.append({
            "section": section_name,
            "features": feature_list
        })

os.makedirs('data', exist_ok=True)
with open('data/features.json', 'w') as f:
    json.dump(final_list, f, indent=2)

print(f"Processed {sum(len(s['features']) for s in final_list)} total features over {len(final_list)} sections.")
