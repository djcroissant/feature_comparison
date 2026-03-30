# Google Workspace Feature Comparison Web App

A beautiful, high-performance web application designed to scrape, aggregate, and present a side-by-side comparative analysis of Google Workspace licenses. 

This project automatically downloads and extracts the raw HTML table structures from the official Google Workspace Essentials and Frontline documentation pages, standardizes the metrics across over 400 distinct features, and presents them via a premium, dark-mode Vanilla JS/CSS frontend interface. 

🌐 **[Live Demo: Workspace Features Comparison](https://djcroissant.github.io/feature_comparison/)**

## Features
- **Automated Data Extraction**: `scraper.py` parses complex Google Knowledge Base docs into raw JSON tables, capturing `<h2>` and `<h3>` category headings.
- **Data Normalization Engine**: `processor.py` aggregates and normalizes feature inclusion (`Included`, `Not included`, `N/A`, `Viewer Only`) across the 4 specific SKUs, outputting a centralized `features.json`.
- **Vanilla UI Structure**: A lightweight frontend (`index.html`, `style.css`, `app.js`) handles responsive tables, multi-column toggling via a centralized SKU selector, and real-time textual search.
- **Beautiful Glassmorphism Design**: Custom dark-theme styling focusing on typography (Inter) and micro-interactions without using heavy CSS frameworks.

## Supported SKUs Evaluated
- Enterprise Essentials
- Enterprise Essentials Plus
- Frontline Standard
- Frontline Plus

## How To Run Locally
1. Simply double-click `index.html` in your file browser (local fetch policies are bypassed by the data packaging script).
2. Or use Python's built-in web server:
```bash
python3 -m http.server 8000
```
Navigate to `http://localhost:8000` via your web browser to interact with the feature matrices.

## How to Update the Data
When Google updates their documentation pages:
```bash
python3 scraper.py
python3 processor.py
python3 -c "import json; d=json.load(open('data/features.json')); open('data/features.js','w').write('const featuresData = ' + json.dumps(d) + ';')"
```
Refresh the page to see the new data populated visually across all sections.
