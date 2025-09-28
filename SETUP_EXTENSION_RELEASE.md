# Chrome Extension CI & Release Guide

This repository now includes automated GitHub Actions workflows for building, packaging and releasing the Chrome extension.

## Workflows Overview

1. **CI (`ci.yml`)**
   - Triggers: pushes & pull requests to `main`.
   - Steps:
     - Install dependencies (monorepo root).
     - Build Next.js web app (ensures no regressions that break shared code).
     - Build the extension.
     - Package the extension into `hireall-extension-dist.zip` (artifact uploaded).
     - Run lint (non-blocking) and Playwright smoke tests (non-blocking).
   - Artifact: downloadable packaged extension zip for quick manual install/testing.

2. **Extension Release (`extension-release.yml`)**
   - Trigger: pushing a tag that matches `extension-v*` (e.g. `extension-v1.2.0`).
   - Steps:
     - Install dependencies.
     - Production build of extension (`WEB_APP_URL=https://hireall.app`).
     - Package the final zip.
     - Generate a SHA256 checksum file.
     - Create a GitHub Release with attached artifacts.
   - Supports marking prereleases automatically if the tag name contains `beta` or `rc` (e.g. `extension-v1.3.0-beta.1`).

## Creating a Release

1. Bump version in `packages/extension/package.json` if needed.
2. Commit & push changes:

```bash
git add packages/extension/package.json
git commit -m "chore(extension): bump to 1.1.0"
git push origin main
```

3. Create and push a tag:

```bash
git tag extension-v1.1.0
git push origin extension-v1.1.0
```

4. The `Extension Release` workflow will run and publish a release with assets:
   - `hireall-extension-dist.zip`
   - `hireall-extension-dist.zip.sha256`

## Installing the Packaged Extension (Manual QA)
1. Download the zip artifact from CI or Release.
2. Extract it.
3. In Chrome visit `chrome://extensions`.
4. Enable Developer Mode.
5. Click **Load unpacked** and select the extracted `dist` folder (or re-zip structure if needed).

## Environment Variables
The extension build relies on the following variables (injected at build time via a single `DefinePlugin`):

- `WEB_APP_URL` (defaults to `https://hireall.app`)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

For CI, you can add repo or environment secrets if you do not want to commit them in `.env`. If they are absent, Firebase initialization will throw (guarded in `firebase.ts`).

## Adding Secret Values in GitHub
If you prefer not to store public config directly:
1. Go to **Settings > Secrets and variables > Actions**.
2. Add each variable as a Repository Variable (they are not truly secret but keeps config centralized).
3. Modify workflows to export them before build:

```yaml
      - name: Export Firebase vars
        run: |
          echo "NEXT_PUBLIC_FIREBASE_API_KEY=${{ vars.NEXT_PUBLIC_FIREBASE_API_KEY }}" >> $GITHUB_ENV
          echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${{ vars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}" >> $GITHUB_ENV
          # repeat for the rest
```

## Future Enhancements (Optional)
- Automated Chrome Web Store publishing using an API key & refresh token.
- Add unit test stage for extension code (ts-jest + light DOM mocks).
- Sign and verify zip contents with GPG.
- Add dependency caching per workspace (`npm install --workspaces --if-present`).
- Integrate conventional commits & automated version bumping (e.g. Changesets or semantic-release) for extension tags.

## Troubleshooting
| Issue | Cause | Fix |
|-------|-------|-----|
| Missing env var error at runtime | Not defined in workflow or .env | Add var in `.env` or GitHub Variables & rebuild |
| Release workflow skipped | Tag did not match pattern | Use `extension-vX.Y.Z` format |
| Firebase config error in popup | One or more values empty | Confirm env injection & repackage |

---
Feel free to request automation of Chrome Web Store submission next.
