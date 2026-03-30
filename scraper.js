import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const essentialsUrl = 'https://knowledge.workspace.google.com/admin/getting-started/editions/compare-essentials-editions';
const frontlineUrl = 'https://knowledge.workspace.google.com/admin/getting-started/editions/compare-frontline-editions?sjid=17864279373018464028-NC&visit_id=639104993134306662-4217303682&rd=1#core';

async function scrapeTables(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Expanding any "expand all" buttons if they exist
  try {
    const expandButtons = await page.$$('button');
    for (const btn of expandButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.toLowerCase().includes('expand all')) {
        await btn.click();
      }
    }
    // Wait a bit for animations
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {
    console.log('No expand all buttons found or failed to click');
  }

  const data = await page.evaluate(() => {
    const result = [];
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
      const headers = [];
      const thead = table.querySelector('thead');
      if (thead) {
        thead.querySelectorAll('tr').forEach(tr => {
          const rowHeaders = Array.from(tr.querySelectorAll('th, td')).map(cell => cell.innerText.trim());
          if (rowHeaders.length > 0) headers.push(rowHeaders);
        });
      } else {
        const firstTr = table.querySelector('tbody tr');
        if (firstTr) {
          headers.push(Array.from(firstTr.querySelectorAll('th, td')).map(cell => cell.innerText.trim()));
        }
      }

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      const tableData = [];
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td, th')).map(td => {
            // Check for checkmarks or icons
            const icon = td.querySelector('span.material-icons, span.google-material-icons');
            if (icon && icon.innerText.trim() === 'done') {
                return 'Included';
            } else if (icon && icon.innerText.trim() === 'close') {
                return 'Not included';
            }
            return td.innerText.trim();
        });
        if (cells.length > 0) {
          tableData.push(cells);
        }
      });
      
      result.push({
        headers,
        rows: tableData
      });
    });
    return result;
  });

  await browser.close();
  return data;
}

async function main() {
  console.log('Scraping Essentials...');
  const essentialsData = await scrapeTables(essentialsUrl);
  
  console.log('Scraping Frontline...');
  const frontlineData = await scrapeTables(frontlineUrl);
  
  const dataDir = path.join(process.cwd(), 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(path.join(dataDir, 'raw_essentials.json'), JSON.stringify(essentialsData, null, 2));
  fs.writeFileSync(path.join(dataDir, 'raw_frontline.json'), JSON.stringify(frontlineData, null, 2));
  console.log('Scraping completed and saved to src/data/raw_*.json');
}

main();
