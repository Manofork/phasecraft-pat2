# Contributing to PhaseCraft

Thank you for helping to improve PhaseCraft. This guide explains how to set up the project and how changes are
reviewed and released.

## 1. Ground rules

- Everyone taking part is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
- The calculation logic, the 5 % limit and the design rules are frozen unless an issue demonstrates a discrepancy
  against the DHET Student Guide or Lecturer Guide for PAT 2.
- `phasecraft.html` (desktop) and `android-app/www/index.html` (Android) each stay a single self contained file. Do
  not split them or extract their embedded images.
- No em dashes or en dashes in user facing text; use colons, commas or the middle dot (·) instead.
- `npm run lint` enforces most of these rules and runs in CI.

## 2. Development setup

Desktop (Node.js 22 LTS):

```bash
git clone https://github.com/Manofork/phasecraft-pat2.git
cd phasecraft-pat2
npm ci
npm start        # run the desktop app
npm run lint     # guard rail checks
npm test         # Android scenario tests
```

Android (Node.js 22 LTS and Android Studio):

```bash
cd android-app
npm ci
npx cap sync android
```

Then open `android-app/android` in Android Studio.

## 3. Branches

Create a branch from `main` with a descriptive prefix: `feat/…`, `fix/…`, `docs/…` or `ci/…`.

## 4. Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `style:`, `refactor:`,
`ci:` or `chore:`, followed by a short summary in the imperative mood.

## 5. Pull requests

- Fill in the pull request template.
- CI must be green before a pull request is merged.
- Include a screenshot for any visual change, and a sample PDF for any change that touches the report.

## 6. Reporting calculation problems

Use the **Calculation discrepancy** issue form. Give the exact inputs, the value shown by the app, the expected value,
and your working or the relevant page of the DHET guide.

## 7. Release process (maintainers only)

1. Update `version` in the root `package.json`, in `android-app/package.json` (run `npm install` in each folder so the
   lock files match) and in `CITATION.cff`.
2. Move the `[Unreleased]` entries in `CHANGELOG.md` under the new version heading with the date.
3. Commit: `chore(release): vX.Y.Z`.
4. `git tag -a vX.Y.Z -m "PhaseCraft vX.Y.Z"` and `git push origin main --follow-tags`.
5. The Release workflow builds and publishes the files automatically; it fails early if the tag and either
   `package.json` version disagree.
