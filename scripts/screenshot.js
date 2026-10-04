const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'docs', 'screenshots');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DESKTOP_SAMPLE = {
  s1_t1wr1: '244', s1_t1wr2: '6.00', s1_t2wr1: '246', s1_t2wr2: '6.10', s1_t3wr1: '244', s1_t3wr2: '6.05',
  s2_vL1L2: '35', s2_vL1L3: '36', s2_vL2L3: '37',
  s3_vL1L2: '35.10', s3_vL1L3: '35.00', s3_vL2L3: '35.20', s3_vL1N: '20.20', s3_vL2N: '20.10', s3_vL3N: '20.30'
};
const CHECKER_SAMPLE = { c1_t1a: '244', c1_t1b: '6.00', c1_t2a: '246', c1_t2b: '6.10', c1_t3a: '244', c1_t3b: '6.05' };

function fill(sample) {
  for (const [id, v] of Object.entries(sample)) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

async function shot(win, name) {
  await win.webContents.capturePage(); // the first capture of a hidden window can return a stale frame
  await sleep(300);
  const image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, name), image.toPNG());
  console.log('Saved docs/screenshots/' + name);
}

app.whenReady().then(async () => {
  fs.mkdirSync(outDir, { recursive: true });

  // Desktop application
  const desk = new BrowserWindow({
    width: 1280, height: 1500, show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  await desk.loadFile(path.join(root, 'phasecraft.html'));
  await sleep(4000); // allow MathJax and fonts to settle
  await desk.webContents.executeJavaScript(`(${fill.toString()})(${JSON.stringify(DESKTOP_SAMPLE)})`);
  for (const [tab, verdict] of [['s1', 's1_overallVerdict'], ['s2', 's2_overallVerdict'], ['s3', 's3_overallVerdict']]) {
    await desk.webContents.executeJavaScript(
      `showTab('${tab}'); if (typeof refreshS1 === 'function') { refreshS1(); refreshS2(); refreshS3(); }`);
    await sleep(2500);
    await desk.webContents.executeJavaScript(
      `document.getElementById('${verdict}').scrollIntoView({ block: 'end', behavior: 'instant' });`);
    await sleep(500);
    await shot(desk, `desktop-subtask-${tab.slice(1)}.png`);
  }

  // Android page at phone size
  const phone = new BrowserWindow({
    width: 390, height: 844, useContentSize: true, show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });
  await phone.loadFile(path.join(root, 'android-app', 'www', 'index.html'));
  await sleep(800);
  await phone.webContents.executeJavaScript(`submitGuess(true);`);
  await sleep(400);
  await shot(phone, 'android-practice.png');
  await phone.webContents.executeJavaScript(
    `setMode('checker'); (${fill.toString()})(${JSON.stringify(CHECKER_SAMPLE)}); refreshChecker1();
     document.getElementById('c1_overall').scrollIntoView({ block: 'end', behavior: 'instant' });`);
  await sleep(500);
  await shot(phone, 'android-checker.png');

  desk.destroy();
  phone.destroy();
  app.quit();
});
