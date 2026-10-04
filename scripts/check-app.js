/**
 * Guard rail checks for the desktop application (phasecraft.html and main.js).
 * Fails CI if required elements, rendering dependencies, colour tokens, attribution or window security settings go
 * missing, or if forbidden text (dashes, third party product names, phone numbers) appears.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'phasecraft.html'), 'utf8');
const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const errors = [];
const need = (cond, msg) => { if (!cond) errors.push(msg); };

// 1. Required element IDs
const ids = [
  'tab-s1', 'tab-s2', 'tab-s3',
  's1_t1wr1', 's1_t1wr2', 's1_t2wr1', 's1_t2wr2', 's1_t3wr1', 's1_t3wr2',
  's1_primaryFormula', 's1_primaryCalcBox', 's1_primaryTolValue', 's1_primaryVerdict', 's1_primaryRange',
  's1_secondaryFormula', 's1_secondaryCalcBox', 's1_secondaryTolValue', 's1_secondaryVerdict', 's1_secondaryRange',
  's1_overallVerdict',
  's2_vL1L2', 's2_vL1L3', 's2_vL2L3',
  's2_balFormula', 's2_balCalcBox', 's2_balValue', 's2_balVerdict', 's2_balRange', 's2_overallVerdict',
  's3_vL1L2', 's3_vL1L3', 's3_vL2L3', 's3_vL1N', 's3_vL2N', 's3_vL3N',
  's3_lineFormula', 's3_lineCalcBox', 's3_lineValue', 's3_lineVerdict', 's3_lineRange',
  's3_phaseFormula', 's3_phaseCalcBox', 's3_phaseValue', 's3_phaseVerdict', 's3_phaseRange',
  's3_ratioFormula', 's3_ratioCalcBox', 's3_ratioValue', 's3_ratioVerdict', 's3_overallVerdict'
];
for (const id of ids) need(new RegExp(`id=["']${id}["']`).test(html), `Missing required element id="${id}"`);

// 2. Required functions
for (const fn of ['computeGroup', 'refreshS1', 'refreshS2', 'refreshS3', 'showTab', 'saveAsPDF']) {
  need(new RegExp(`function\\s+${fn}\\s*\\(`).test(html), `Missing function ${fn}()`);
}
need(/tol\s*<=\s*5/.test(html), 'The 5 percent tolerance test (tol <= 5) is missing');

// 3. PDF and maths rendering dependencies
need(html.includes('tex-svg.js'), 'MathJax must be the SVG build (tex-svg.js)');
need(!html.includes('tex-mml-chtml'), 'tex-mml-chtml.js must not be used (no SVG output)');
need(html.includes('svg2pdf.js@2.2.1'), 'svg2pdf.js 2.2.1 from jsDelivr is required');
need(html.includes('tex2svgPromise'), 'MathJax.tex2svgPromise is required by the PDF pipeline');
need(/typeof\s+pdf\.svg/.test(html), 'The pdf.svg availability check is missing');
need(/\{\\\\bf\s/.test(html), 'Table headers must use {\\bf ...} not \\textbf');

// 4. Design tokens, fonts, attribution
const tokens = { navy: '#1b2a41', teal: '#0f7d8f', amber: '#c8862a', green: '#1e7d3c', red: '#b3261e' };
for (const [name, hex] of Object.entries(tokens)) {
  need(new RegExp(`--${name}:\\s*${hex}`, 'i').test(html), `Design token --${name}: ${hex} missing`);
}
need(/font-family:\s*Georgia/.test(html), 'Georgia body font declaration missing');
need(html.includes('.calc-box') && html.includes('-apple-system'), 'Sans-serif rule for calculation elements missing');
need(html.includes('MJ Maake'), 'Author attribution "MJ Maake" missing');

// 4b. The three wiring diagrams (one per subtask) are embedded in the page as base64 PNGs
const embedded = (html.match(/src="data:image\/png;base64,[A-Za-z0-9+\/=]{1000,}/g) || []).length;
need(embedded >= 3, `Expected 3 embedded subtask diagrams (base64 PNG), found ${embedded}`);

// 5. Window security (main.js)
need(/devTools:\s*false/.test(main), 'devTools must be disabled in main.js');
need(/contextIsolation:\s*true/.test(main), 'contextIsolation must be true');
need(/nodeIntegration:\s*false/.test(main), 'nodeIntegration must be false');
need(/Menu\.setApplicationMenu\(null\)/.test(main), 'Application menu must be removed');
need(main.includes('phasecraft.html'), 'main.js must load phasecraft.html');

// 6. Forbidden text (ignore the very long base64 lines)
const scan = (name, text) => {
  const lines = text.split(/\r?\n/).filter(l => l.length < 5000).join('\n');
  need(!/[\u2013\u2014]|&mdash;|&ndash;|&#821[12];|&#8211;|&#8212;/.test(lines), `${name}: em or en dash found`);
  need(!/c[l]aude|a[n]thropic|c[o]dex|o[p]enai|c[h]atgpt|c[o]pilot/i.test(lines), `${name}: third party product name found`);
  need(!/\b0\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b/.test(lines), `${name}: a phone number pattern appears`);
};
scan('phasecraft.html', html);
scan('main.js', main);

// 7. Inline scripts must at least compile
const scriptRe = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let m, n = 0;
while ((m = scriptRe.exec(html))) {
  n++;
  try { new vm.Script(m[1]); } catch (e) { errors.push(`Inline script ${n} has a syntax error: ${e.message}`); }
}
need(n > 0, 'No inline script found in phasecraft.html');

if (errors.length) {
  for (const e of errors) console.error(`x ${e}`);
  process.exit(1);
}
console.log(`OK desktop checks passed (${ids.length} IDs, ${n} inline scripts compiled)`);
