# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 1.x | Yes |
| < 1.0 | No |

## Reporting a vulnerability

Please do **not** open a public issue. Use GitHub's private reporting:
**Security** tab, then **Report a vulnerability**, or email manoke@hotmail.co.za.
You will receive an acknowledgement within 7 days.

## Security design

- Desktop: `contextIsolation` is enabled, `nodeIntegration` is disabled, developer tools are disabled and the menu bar
  is removed. The page loads MathJax and the PDF libraries from public CDNs over HTTPS; no other remote code is run.
- Android: the app is a single offline page with no network calls. The `INTERNET` permission is present only because
  the Capacitor template declares it; the app does not use it.
- Release files are built by GitHub Actions from tagged source and published with SHA256 checksums. The Windows
  executables are not code signed, and the Android package is a debug build signed with a debug key.
