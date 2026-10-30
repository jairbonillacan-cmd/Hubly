const { chromium } = require('C:/Users/T490s/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

(async () => {
  const out = path.join(__dirname, 'landing-preview');
  fs.mkdirSync(out, { recursive: true });
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3200'], { cwd: path.resolve(__dirname, '../../web'), windowsHide: true, stdio: 'ignore' });
  let browser;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try { ready = (await fetch('http://127.0.0.1:3200')).ok; } catch {}
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error('Preview server did not become ready');
    browser = await chromium.launch({ headless: true, executablePath: 'C:/Users/T490s/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
    for (const width of [1440, 900, 861, 375, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:3200', { waitUntil: 'networkidle' });
      await page.locator('.footer .logo').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('.logo img')].every(img => img.complete && img.naturalWidth > 0));
      const result = await page.evaluate(() => {
        const logos = [...document.querySelectorAll('.logo img')].map(img => ({ loaded: img.complete && img.naturalWidth > 0, width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height }));
        const items = [...document.querySelector('.nav-inner').children].filter(el => getComputedStyle(el).display !== 'none').map(el => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right }; });
        return { logos, overflow: document.documentElement.scrollWidth > innerWidth, navOverlap: items.some((item, i) => i > 0 && items[i - 1].right > item.left), homeLinks: [...document.querySelectorAll('a.logo')].every(a => a.getAttribute('href') === '#inicio') };
      });
      console.log(JSON.stringify({ width, ...result, errors }));
      if (result.overflow || result.navOverlap || !result.homeLinks || errors.length || result.logos.length !== 2 || result.logos.some(logo => !logo.loaded)) process.exitCode = 1;
      if (width === 1440 || width === 375) {
        await page.screenshot({ path: path.join(out, `footer-${width}.png`) });
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.screenshot({ path: path.join(out, `header-${width}.png`) });
      }
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
