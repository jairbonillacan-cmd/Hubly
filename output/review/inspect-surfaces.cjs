const { chromium } = require('C:/Users/T490s/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const root = path.resolve(__dirname, '../..');
  const base = 'http://127.0.0.1:3400';
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3400'], { cwd: path.join(root, 'web'), windowsHide: true, stdio: 'ignore' });
  let browser;
  const results = [];
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { ready = (await fetch(base)).ok; } catch {}
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error('Preview server unavailable');
    browser = await chromium.launch({ headless: true, executablePath: 'C:/Users/T490s/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
    for (const route of (process.argv.includes('--api-only') ? [] : ['/', '/dashboard'])) {
      for (const width of [1440, 900, 375, 320]) {
        const context = await browser.newContext({ viewport: { width, height: 1000 } });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));
        // Keep the review isolated: no workspace writes reach the server.
        await page.route('**/api/workspace', async request => {
          if (request.request().method() === 'POST') await request.fulfill({ json: { ok: true } });
          else await request.continue();
        });
        const response = await page.goto(base + route, { waitUntil: 'networkidle' });
        const details = await page.evaluate(() => {
          const css = getComputedStyle(document.documentElement);
          const nav = document.querySelector('.nav-inner');
          const items = nav ? [...nav.children].filter(e => getComputedStyle(e).display !== 'none').map(e => { const r = e.getBoundingClientRect(); return { left: r.left, right: r.right }; }) : [];
          const sidebar = document.querySelector('.saas-sidebar');
          const main = document.querySelector('main');
          const cards = document.querySelector('.saas-bento');
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            navOverlap: items.some((item, i) => i > 0 && items[i - 1].right > item.left),
            navOutsideViewport: items.some(item => item.right > innerWidth || item.left < 0),
            mainPadding: main ? getComputedStyle(main).padding : null,
            dashboardGridDisplay: cards ? getComputedStyle(cards).display : null,
            mobileMenuDisplay: document.getElementById('mobile-menu-trigger') ? getComputedStyle(document.getElementById('mobile-menu-trigger')).display : null,
            sidebarRight: sidebar ? sidebar.getBoundingClientRect().right : null,
            forestToken: css.getPropertyValue('--forest').trim(),
            headings: [...document.querySelectorAll('h1')].map(e => e.textContent.trim()),
          };
        });
        const item = { route, width, status: response.status(), ...details, errors };
        if (width === 1440 || width === 375) await page.screenshot({ path: path.join(__dirname, `${route === '/' ? 'landing' : 'dashboard'}-${width}.png`) });
        if (route === '/dashboard' && width === 1440) {
          await page.getByRole('button', { name: 'Invitar equipo', exact: true }).click();
          item.inviteShowsTeamTable = await page.getByText('Rendimiento del Equipo', { exact: true }).isVisible();
          item.inviteShowsDialog = await page.getByRole('dialog').count();
          await page.screenshot({ path: path.join(__dirname, 'dashboard-team-1440.png') });
          await page.getByRole('button', { name: 'Nuevo post', exact: true }).first().click();
          item.newPostDialogVisible = await page.getByRole('dialog').count();
          await page.keyboard.press('Escape');
          item.dialogsAfterEscape = await page.getByRole('dialog').count();
        }
        results.push(item);
        console.log(JSON.stringify(item));
        await context.close();
      }
    }
    const response = await fetch(base + '/api/workspace');
    const data = await response.json();
    const api = { anonymousWorkspaceReadStatus: response.status, returnsAgencyData: Array.isArray(data.brands) && Array.isArray(data.team) };
    results.push(api);
    console.log(JSON.stringify(api));
    fs.writeFileSync(path.join(__dirname, 'findings.json'), JSON.stringify(results, null, 2));
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
