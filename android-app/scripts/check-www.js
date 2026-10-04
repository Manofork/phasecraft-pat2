/**
 * Guard rail checks for the Android application and its native configuration.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const base = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(base, 'www', 'index.html'), 'utf8');
const errors = [];
const need = (cond, msg) => { if (!cond) errors.push(msg); };
const read = (...p) => fs.readFileSync(path.join(base, ...p), 'utf8');

// 1. Required elements
const ids = [
  'view-practice', 'view-checker', 'practiceCard', 'practiceTitle', 'practiceTableWrap', 'scoreValue',
  'btnGuessPass', 'btnGuessFail', 'feedbackBox', 'fbTitle', 'fbCalc', 'fbExplain', 'nextBtn',
  'c1_fields', 'c1_primary_result', 'c1_secondary_result', 'c1_overall',
  'c2_a', 'c2_b', 'c2_c', 'c2_result',
  'c3_l1l2', 'c3_l1l3', 'c3_l2l3', 'c3_l1n', 'c3_l2n', 'c3_l3n', 'c3_line_result', 'c3_phase_result', 'c3_ratio_result',
  'navPractice', 'navChecker', 'modeBtnPractice', 'modeBtnChecker'
];
for (const id of ids) need(new RegExp(`id=["']${id}["']`).test(html), `Missing required element id="${id}"`);
for (const fn of ['computeGroup', 'genS1Scenario', 'genS2Scenario', 'genS3Scenario', 'evaluateScenario',
                  'submitGuess', 'nextScenario', 'setMode', 'refreshChecker1', 'refreshChecker2', 'refreshChecker3']) {
  need(new RegExp(`function\\s+${fn}\\s*\\(`).test(html), `Missing function ${fn}()`);
}

// 2. Mobile and offline requirements
need(/<meta[^>]+name=["']viewport["'][^>]*viewport-fit=cover/.test(html), 'Viewport meta tag with viewport-fit=cover missing');
need(!/(src|href)\s*=\s*["']https?:/i.test(html), 'The app must be offline: no http(s) src or href');
need(!/url\(\s*["']?https?:/i.test(html), 'The app must be offline: no remote CSS urls');
need(!/@import/.test(html), 'No @import (offline)');
need(html.includes('Designed and built by MJ Maake'), 'Credit "Designed and built by MJ Maake" missing');

// 3. Forbidden text
const text = html.split(/\r?\n/).filter(l => l.length < 5000).join('\n');
need(!/[\u2013\u2014]|&mdash;|&ndash;|&#821[12];|&#8211;|&#8212;/.test(text), 'www/index.html: em or en dash found');
need(!/c[l]aude|a[n]thropic|c[o]dex|o[p]enai|c[h]atgpt|c[o]pilot/i.test(text), 'www/index.html: third party product name found');

// 4. Inline script compiles
const m = html.match(/<script>([\s\S]*)<\/script>/);
need(!!m, 'Inline script not found');
if (m) { try { new vm.Script(m[1]); } catch (e) { errors.push(`Inline script syntax error: ${e.message}`); } }

// 5. Identity and native configuration
const cfg = JSON.parse(read('capacitor.config.json'));
need(cfg.appId === 'com.mjmaake.phasecraft', 'capacitor.config.json appId must be com.mjmaake.phasecraft');
need(cfg.appName === 'PhaseCraft', 'capacitor.config.json appName must be PhaseCraft');
need(cfg.webDir === 'www', 'capacitor.config.json webDir must be www');

const gradle = read('android', 'app', 'build.gradle');
need(/namespace\s*=?\s*["']com\.mjmaake\.phasecraft["']/.test(gradle), 'build.gradle namespace must be com.mjmaake.phasecraft');
need(/applicationId\s*=?\s*["']com\.mjmaake\.phasecraft["']/.test(gradle), 'build.gradle applicationId must be com.mjmaake.phasecraft');
need(/v1SigningEnabled\s+true/.test(gradle) && /v2SigningEnabled\s+true/.test(gradle), 'Debug signing config (v1 and v2) must be kept');
need(/useLegacyPackaging\s*=\s*true/.test(gradle), 'jniLibs useLegacyPackaging = true must be kept');
need(fs.existsSync(path.join(base, 'android', 'app', 'src', 'main', 'java', 'com', 'mjmaake', 'phasecraft', 'MainActivity.java')),
     'MainActivity.java missing in com/mjmaake/phasecraft');
const strings = read('android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
need(/<string name="app_name">PhaseCraft<\/string>/.test(strings), 'strings.xml app_name must be PhaseCraft');
need(/<string name="title_activity_main">PhaseCraft<\/string>/.test(strings), 'strings.xml title_activity_main must be PhaseCraft');
need(/<string name="package_name">com\.mjmaake\.phasecraft<\/string>/.test(strings), 'strings.xml package_name must be com.mjmaake.phasecraft');
need(/<string name="custom_url_scheme">com\.mjmaake\.phasecraft<\/string>/.test(strings), 'strings.xml custom_url_scheme must be com.mjmaake.phasecraft');
for (const d of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
  for (const f of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
    need(fs.existsSync(path.join(base, 'android', 'app', 'src', 'main', 'res', `mipmap-${d}`, f)), `Missing launcher icon mipmap-${d}/${f}`);
  }
}

// 6. No stale Capacitor placeholder names anywhere in the native sources
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['build', '.gradle', '.idea', 'assets'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const textExt = /\.(java|xml|gradle|json|properties)$/;
for (const f of walk(path.join(base, 'android', 'app', 'src')).concat(walk(path.join(base, 'android'), []).filter(f => /\.gradle$/.test(f)))) {
  if (!textExt.test(f)) continue;
  const t = fs.readFileSync(f, 'utf8');
  if (/com\.getcapacitor\.(myapp|app)\b/.test(t)) errors.push(`Stale placeholder name in ${path.relative(base, f)}`);
}
if (fs.existsSync(path.join(base, 'android', 'app', 'src', 'main', 'java', 'com', 'getcapacitor'))) {
  errors.push('Stale folder com/getcapacitor still exists in the native sources');
}

if (errors.length) {
  for (const e of errors) console.error(`x ${e}`);
  process.exit(1);
}
console.log(`OK Android checks passed (${ids.length} IDs)`);
