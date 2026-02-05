# Shirt Tracker

Shirt Tracker is a personal inventory app for tracking shirts across brands, types, and collections. It supports a desktop app (Tauri), a desktop web app, and a mobile web app, all backed by Supabase for authentication, storage, and syncing.

## Apps

- **Desktop app (Tauri)**: `apps/desktop-tauri/`
- **Desktop web**: `apps/web-desktop/`
- **Mobile web**: `apps/web-mobile/`
- **Netlify publish folder** (generated): `apps/web-root/`

## Key Features

- Multi-tab shirt inventory with custom columns
- Photo uploads (Supabase Storage)
- Auth + cloud sync
- Public share links with column visibility controls
- Desktop app menu actions (About, Attributes, Event Log, Export)

## Tech Stack

- HTML/CSS/Vanilla JS
- Tauri (desktop app)
- Supabase (auth, storage, data)
- Netlify (web deploy + mobile/desktop routing)

## Local Development

Desktop app (Tauri):

```bash
npm run tauri dev
```

Web build (Netlify publish folder):

```bash
npm run build:web-root
```

Preview web build locally:

```bash
npx serve "apps/web-root"
# Then open:
# http://localhost:3000/d/ (desktop web)
# http://localhost:3000/m/ (mobile web)
```

## Build & Install Desktop App

```bash
npm run tauri build
```

The app bundle will be at:

```
apps/desktop-tauri/src-tauri/target/release/bundle/macos/Shirt Tracker.app
```

Drag it into `/Applications` to run without the terminal.

## Deploy (Netlify)

Build command:

```
npm run build:web-root
```

Publish directory:

```
apps/web-root
```

The `_redirects` file is generated into `apps/web-root/` by the build script and handles `/d` and `/m` routing.

## Supabase Configuration

Supabase settings live directly in the HTML files:

- `SUPABASE_URL`
- `SUPABASE_KEY` (publishable key)
- `SUPABASE_BUCKET`

If you change projects, update those values in:

- `apps/desktop-tauri/src/index.html`
- `apps/web-desktop/src/index.html`
- `apps/web-mobile/src/index.html`

## Versioning

App versions are tracked in:

- `apps/desktop-tauri/src/index.html` (`APP_VERSION`)
- `apps/web-desktop/src/index.html` (`APP_VERSION`)
- `apps/web-mobile/src/index.html` (`APP_VERSION`)
- `apps/desktop-tauri/src-tauri/tauri.conf.json`

## Icons

Web/app icons are set to `assets/icons/hawaiian-shirt.png`.
To regenerate the Tauri icon set:

```bash
npx tauri icon "apps/desktop-tauri/src/assets/icons/hawaiian-shirt.png"
```

### Keep desktop app in sync

Run this before building the desktop app:

`npm run sync:tauri`

### One-click sync app

`Shirt Tracker Sync.app` lives in the repo root. Double-click it to run the Tauri sync + build, then it shows a success dialog with timestamp and version.

## License

All rights reserved. See in-app Legal section for attribution and usage notes.
