/**
 * Tests the Practice mode scenario generators and the Pass/Fail evaluation in www/index.html.
 * The page script is run in a sandbox with a permissive DOM stub.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'www', 'index.html'), 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('x inline script not found'); process.exit(1); }

function stub() {
  const f = function () {};
  return new Proxy(f, {
    get: (t, p) => (p === Symbol.toPrimitive ? () => '' : p in t ? t[p] : stub()),
    set: () => true,
    apply: () => stub(),
    construct: () => stub()
  });
}
const ctx = vm.createContext({ document: { getElementById: () => stub() }, console });
vm.runInContext(m[1] + '\n;globalThis.__t = { computeGroup, genS1Scenario, genS2Scenario, genS3Scenario, evaluateScenario };', ctx);
const t = ctx.__t;

const errors = [];
const expect = (cond, msg) => { if (!cond) errors.push(msg); };

// Deterministic cases (the known good values from the handover)
expect(Math.abs(t.computeGroup([244, 246, 244]).tol - 0.545) < 0.01, 'computeGroup([244,246,244]) should be about 0.54 %');
expect(t.evaluateScenario({ kind: 's1', primary: [244, 246, 244], secondary: [6.00, 6.10, 6.05] }).pass === true, 'S1 sample should pass');
expect(t.evaluateScenario({ kind: 's1', primary: [244, 246, 270], secondary: [6.00, 6.10, 6.05] }).pass === false, 'S1 with 270 should fail');
expect(t.evaluateScenario({ kind: 's2', vals: [35, 36, 37] }).pass === true, 'S2 35/36/37 should pass');
expect(t.evaluateScenario({ kind: 's2', vals: [35, 36, 45] }).pass === false, 'S2 35/36/45 should fail');
expect(t.evaluateScenario({ kind: 's3', lineVals: [35.10, 35.00, 35.20], phaseVals: [20.20, 20.10, 20.30] }).pass === true, 'S3 sample should pass');
expect(t.evaluateScenario({ kind: 's3', lineVals: [35.10, 35.00, 35.20], phaseVals: [24.24, 24.12, 24.36] }).pass === false, 'S3 with broken root three ratio should fail');

// Statistical: forced failures must really fail. Nominal fail shares are 0.40, 0.40 and 0.45.
// With the old 6 to 12 percent perturbation the shares dropped to roughly 0.31, so these bounds catch that regression.
const N = 20000;
const bounds = { genS1Scenario: [0.36, 0.44], genS2Scenario: [0.36, 0.44], genS3Scenario: [0.41, 0.49] };
for (const [gen, [lo, hi]] of Object.entries(bounds)) {
  let fails = 0;
  for (let i = 0; i < N; i++) if (!t.evaluateScenario(t[gen]()).pass) fails++;
  const share = fails / N;
  console.log(`${gen}: fail share ${(share * 100).toFixed(1)} % (expected ${lo * 100} to ${hi * 100} %)`);
  expect(share >= lo && share <= hi, `${gen} fail share ${share.toFixed(3)} is outside ${lo} to ${hi}`);
}

if (errors.length) {
  for (const e of errors) console.error(`x ${e}`);
  process.exit(1);
}
console.log('OK scenario tests passed');
