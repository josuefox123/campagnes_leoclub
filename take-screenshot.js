const { chromium } = require('playwright');
const path = require('path');

async function captureEditor() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  console.log('Navigating to editor...');
  await page.goto('http://localhost:3000/editor', { waitUntil: 'networkidle' });
  
  const screenshotPath = path.join(__dirname, 'editor_debug.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved to: ${screenshotPath}`);
  
  await browser.close();
}

captureEditor().catch(console.error);
