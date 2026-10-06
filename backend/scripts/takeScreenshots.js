const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOTS_DIR = path.join(__dirname, '..', '..', 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching Edge browser at:', EDGE_PATH);
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('1. Navigating to Dashboard...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.waitForTimeout ? page.waitForTimeout(1500) : new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_dashboard.png') });
  console.log('Saved 01_dashboard.png');

  console.log('2. Navigating to Medicines (VIEW BEFORE INSERT)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const medBtn = btns.find(b => b.textContent.includes('Medicines'));
    if (medBtn) medBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_medicines_view_before.png') });
  console.log('Saved 02_medicines_view_before.png');

  console.log('3. Opening Add Medicine Modal & Autofilling Demo Data (INSERT FORM)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Add Medicine'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const autoBtn = btns.find(b => b.textContent.includes('Autofill'));
    if (autoBtn) autoBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_medicines_insert_form.png') });
  console.log('Saved 03_medicines_insert_form.png');

  console.log('4. Executing INSERT (AFTER INSERT)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const execBtn = btns.find(b => b.textContent.includes('Execute INSERT'));
    if (execBtn) execBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_medicines_after_insert.png') });
  console.log('Saved 04_medicines_after_insert.png');

  console.log('5. Clicking Delete on newly inserted record (DELETE CONFIRMATION)...');
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    if (rows.length > 0) {
      const delBtn = rows[0].querySelector('button');
      if (delBtn) delBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_medicines_delete_confirmation.png') });
  console.log('Saved 05_medicines_delete_confirmation.png');

  console.log('6. Confirming DELETE (AFTER DELETE)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const confirmBtn = btns.find(b => b.textContent.includes('Confirm DELETE'));
    if (confirmBtn) confirmBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_medicines_after_delete.png') });
  console.log('Saved 06_medicines_after_delete.png');

  console.log('7. Navigating to Patients Registry...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const patBtn = btns.find(b => b.textContent.includes('Patients'));
    if (patBtn) patBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_patients_view.png') });
  console.log('Saved 07_patients_view.png');

  console.log('8. Navigating to Prescriptions (ACID Transactions)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const presBtn = btns.find(b => b.textContent.includes('Prescriptions'));
    if (presBtn) presBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_prescriptions_view.png') });
  console.log('Saved 08_prescriptions_view.png');

  console.log('9. Navigating to Database Operations (Presentation-III Demo Console)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const opsBtn = btns.find(b => b.textContent.includes('Database Operations'));
    if (opsBtn) opsBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_db_operations_console.png') });
  console.log('Saved 09_db_operations_console.png');

  console.log('10. Navigating to MySQL Health Status...');
  await page.goto('http://localhost:5000/api/health', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_mysql_health_status.png') });
  console.log('Saved 10_mysql_health_status.png');

  await browser.close();
  console.log('All screenshots captured successfully in:', SCREENSHOTS_DIR);
}

capture().catch(err => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
