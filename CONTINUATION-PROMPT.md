# Shirt Tracker — Continuation Prompt (v2.0.5)

## What This Is
Shirt Tracker is a fan-made, open-source clothing inventory web app built with zero dependencies (vanilla JS/CSS/HTML). Uses Supabase for auth, cloud sync, and photo storage. Runs as a web app (desktop and mobile) and as a Tauri v2 desktop app.


## Project Location
- Root: `/Users/blacknova/Documents/Shirt Tracker/shirt-tracker/`
- Repo: `https://github.com/aaronmdunn/shirt-tracker`
- Current version: `2.0.5` (`APP_VERSION` in app.js line 31)
- License: GPL-3.0


---

## !!! IMPORTANT RULES — DO NOT IGNORE !!!

> **These rules are NON-NEGOTIABLE. Follow them EVERY time, no exceptions.**

### 1. NEVER push to `main`
- **ALL commits go to the `beta-test` branch ONLY.**
- After pushing to `beta-test`, **ALWAYS create a PR** from `beta-test` → `main`.
- The user will test the deploy preview and merge when ready.
- There are real users on production. Breaking `main` breaks their app and potentially their data.

### 2. ALWAYS ask before proceeding
- **Do NOT start making changes without explaining what you plan to do first.**
- Explain the plan in simple terms (ELI5 — Explain Like I'm 5).
- **Wait for explicit approval** before writing any code.
- Give the user time to read and understand what's going to happen.

### 3. ALWAYS ELI5
- Explain everything in plain, simple English.
- Avoid jargon unless necessary, and define it when used.
- The user should always understand what's happening and why.

### 4. ALWAYS build and sync after code changes
- Run `node scripts/build-web-root.mjs`
- Run `node scripts/sync-tauri-html.mjs`
- Commit the built outputs along with source changes.

### 5. Apply changes to ALL versions by default
- By default, apply every code change to BOTH `apps/web-desktop/src/` and `apps/web-mobile/src/`, then rebuild web-root and sync tauri.
- **Exception:** If the user explicitly says to only change one version (e.g. "only mobile" or "just desktop"), then ONLY change that version. Do NOT touch the other. Still rebuild web-root and sync tauri afterward.

### 6. No commits unless explicitly asked

---


## Git Workflow
- **Working branch: `beta-test`** — all development happens here
- **NEVER push directly to `main`** — changes go through pull requests ONLY
- Workflow: develop on `beta-test` → push → create PR → user tests deploy preview → user merges to `main`
- Build outputs are committed (web-root + Tauri)
- **Rollback tag:** `pre-security-audit` marks the state of `main` before the v2.0.5 security audit was merged (commit `91c411c`). Can revert with `git reset --hard pre-security-audit` if needed.


## Architecture (No Shared Code)
```
apps/
  web-desktop/src/        <- Desktop web (primary)
    app.js  (~7.5k lines)
    style.css (~2.3k lines)
    index.html (~915 lines)
  web-mobile/src/         <- Mobile web (parallel copy)
    app.js  (~7.4k lines)
    style.css (~2.4k lines)
    index.html (~934 lines)
  desktop-tauri/
    src/index.html        (synced single-file build of web-desktop)
    src-tauri/tauri.conf.json
  web-root/
    d/                    (desktop build output)
    m/                    (mobile build output)
    robots.txt            (allows all crawlers)
    auth-redirect.html    (preserves query params + hash through device routing)
    _redirects            (Netlify routing)
scripts/
  build-web-root.mjs      (copies src -> web-root, injects changelog, inlines CSS/JS)
  sync-tauri-html.mjs     (inlines CSS/JS into Tauri index.html)
  bump-version.mjs        (updates version in all 5 files)
netlify/
  functions/
    backup.mjs            (scheduled daily backup to Supabase Storage)
    request-access.mjs    (automated invite via Supabase)
netlify.toml              (function config + security headers including CSP)
CHANGELOG.json            (single source of truth for in-app changelog)
release-notes/            (per-version markdown release notes)
```


## Critical Rules
1. **NEVER push to `main`** — push to `beta-test` and create a PR. See IMPORTANT RULES above.
2. **ALWAYS explain and ask before proceeding** — ELI5 the plan, wait for approval.
3. **No CSS changes** unless explicitly authorized. Use inline JS styles if needed.
4. **Changes must go to BOTH** `apps/web-desktop/src/` and `apps/web-mobile/src/`.
5. **Always run builds** after edits: `build-web-root.mjs` then `sync-tauri-html.mjs`.
6. No unsanitized `innerHTML` with user data (static strings are OK). Use `createElement` + `textContent` + `setAttribute` for any user-controlled content.
7. **No commits** unless explicitly asked.
8. Build outputs are committed (web-root + Tauri).
9. **No new dependencies.**
10. **No `showToast()`** (does not exist).
11. Use `node scripts/bump-version.mjs <version>` when bumping versions — updates all 5 files.


## Build Pipeline
```
node scripts/build-web-root.mjs   -> copies src to web-root/d and web-root/m
                                  -> injects CHANGELOG.json (replaces /* __CHANGELOG_INJECT__ */ [])
                                  -> injects LAST_COMMIT_DATE
                                  -> inlines style.css + app.js into index.html
                                  -> writes _redirects and auth-redirect.html

node scripts/sync-tauri-html.mjs  -> inlines desktop src into Tauri index.html
                                  -> injects CHANGELOG.json + build timestamp
```


## Security Hardening (v2.0.5)
A full security audit was performed and the following changes were applied:

### Content Security Policy (netlify.toml)
- `script-src 'self' 'unsafe-inline'` + jsDelivr + GTM — `'unsafe-inline'` is required because the HTML files have author-written inline scripts for GTM init, share-token pre-loading, and UA routing
- `connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.googletagmanager.com` — wildcarded because Supabase SDK uses multiple subdomains for auth/realtime, and GA uses regional subdomains
- `img-src 'self' data: blob: https://*.supabase.co`
- `style-src 'self' 'unsafe-inline'` — required by extensive inline styles
- `frame-ancestors 'none'` — prevents clickjacking
- `form-action 'self'` — prevents form hijacking
- Also sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`

### XSS Fix in renderColumns()
- Both app.js files: `renderColumns()` previously used `innerHTML` with user-typed column names, types, and dropdown options. Replaced with `createElement` / `textContent` / `setAttribute`.

### Share Token Validation
- Both app.js files: `isValidShareToken()` validates `?share=` URL parameter as UUID regex before passing to Supabase query. Non-UUID values silently rejected.

### Error Banner Filtering
- Both app.js files: `unhandledrejection` handler now ignores `NetworkError`, `Failed to fetch`, and `Load failed` — these are non-critical (e.g. analytics blocked by ad blockers or CSP) and should not show a scary red error banner.

### Netlify Function Hardening
- **request-access.mjs:** Body parsed once (was parsed twice), honeypot checked first, added name (200 char) and email (254 char) length limits.
- **backup.mjs:** Direct HTTP calls require `x-backup-secret` header when `BACKUP_SECRET` env var is set. Scheduled cron calls always allowed. **`BACKUP_SECRET` must be set in Netlify env vars.**

### Supabase Anon Key
- The hardcoded key in app.js (`SUPABASE_KEY`) is the **anon/publishable key** — safe to expose by design. Security depends on RLS policies (documented below).


## Storage Keys (localStorage)
| Key | Purpose |
|---|---|
| `shirts-db-v3:{tabId}` | Inventory tab data |
| `wishlist-db-v1:{tabId}` | Wishlist tab data |
| `shirts-tabs-v1` / `wishlist-tabs-v1` | Tab lists |
| `shirts-columns-v2` / `wishlist-columns-v1` | Global columns |
| `shirts-app-mode` | "inventory" or "wishlist" |
| `shirts-custom-tags-v1` | Persistent user-created tag list (shared across all tabs) |
| `shirts-event-log-v1` | Event log entries (max 200) |
| `shirts-current-user` | Current user ID |


## Two-Mode Architecture
Inventory vs Wishlist. Same in-memory objects (`state`, `tabsState`, `columnOverrides`, `globalColumns`), swapped at runtime via `switchAppMode()`.


## Tag System

### How Tags Are Stored
- Each row has a `tags: []` array of strings (e.g. `["Floral", "Holiday"]`)
- `getRowTags(row)` is the canonical accessor — filters out blanks
- `defaultRow()` initializes `tags: []`; `ensureRowCells()` normalizes missing tags to `[]`

### Tag Sources (Three Layers)
1. **`BASE_TAG_SUGGESTIONS`** — Hardcoded: Floral, Christmas, Halloween, Holiday, Patriotic, Movie, Animation, Original, Dropzone
2. **`shirts-custom-tags-v1`** — Persistent localStorage list. New tags saved here permanently, shared across all tabs.
3. **Row-discovered tags** — `getAllTags()` scans current tab's rows for any additional tags.

### Key Functions
| Function | Purpose |
|---|---|
| `loadCustomTags()` / `saveCustomTags()` | Read/write persistent custom tags |
| `persistNewTags(incoming)` | Adds new tags to persistent list, triggers sync |
| `getAllTags()` | All known tags (base + custom + row-discovered), sorted alphabetically |
| `getUsedTags()` | Only tags on rows (for filter dropdown) |
| `setRowTags(rowId, nextTags, logContext)` | Sets tags on a row, saves, syncs, re-renders, logs |
| `mergeTags(current, incoming)` | Case-insensitive merge/dedup |
| `addTagsFromInput()` | Reads text input, merges into row, persists |

### Manage Tags (Rename/Delete)
- "Manage Tags" button in tags dialog switches to management view
- Each tag: text input (rename) + Delete button
- **Rename:** Updates persistent list + replaces on every row
- **Delete:** Removes from persistent list + strips from every row
- Functions: `renderManageTagsView()`, `renameGlobalTag()`, `deleteGlobalTag()`, `showTagsMainView()`

### Cloud Sync
- `customTags` field in `buildCloudPayload()` / `applyCloudPayload()`

### For Sale (Special Tag)
- `FOR_SALE_TAG` = `"For Sale"` — stored as a regular tag
- `isForSale(row)` / `toggleForSale(rowId)` — check/toggle
- Green "FOR SALE" badge rendered under Name cell


## Cloud Sync Gotchas
- `applyCloudPayload()` must call `applyTabFandomOptions()`, `applyTabTypeOptions()`, `applyTabBrandOptions()` after `loadState()`
- Do NOT call `applyGlobalColumns()` inside `applyCloudPayload()`
- `flushInputsToState()` reads DOM inputs back to `state.rows` — can clobber in-memory changes if DOM is stale. Clear `sheetBody.innerHTML` before saving/rendering if you've modified state directly.


## Netlify / Auth Gotchas
- **Hash fragments and redirects** — Netlify 302 redirects drop hash fragments. Auth callbacks and share links go through `auth-redirect.html` (served as 200) to preserve them.
- **`build-web-root.mjs` wipes `web-root/`** — `fs.rmSync(outDir)` then regenerates. Never add files directly to web-root.
- **Invite endpoint** — Use `POST /auth/v1/invite`, not `/auth/v1/admin/invite` or `/auth/v1/admin/users`.
- **Invite tokens are single-use** — once clicked, consumed. Some email clients prefetch URLs.

### Supabase RLS Policies on `shirt_state`
| Policy | Action | Condition |
|---|---|---|
| `write owner only` | INSERT | `user_id = (select auth.uid())` |
| `anon read by exact share id` | SELECT | `data->>'publicShareId' IS NOT NULL` |
| `read owner or viewer` | SELECT | `user_id = auth.uid() OR auth.uid() = ANY(viewer_ids)` |
| `update owner only` | UPDATE | `user_id = (select auth.uid())` |
| `delete owner only` | DELETE | `user_id = (select auth.uid())` |

All policies use `(select auth.uid())` to avoid per-row re-evaluation.


## CSV Import/Export
- **Import:** `importCsv()` — file picker, maps headers to columns, dialog with append/overwrite/fill-empty modes
- **Export:** `exportCsv()` — comma-delimited, Tags as last column, uses `buildStateFromDom()`
- **Important:** Clear `sheetBody.innerHTML` before `saveState()` + `renderTable()` to prevent `flushInputsToState()` from clobbering imported values


## Known Patterns / Pitfalls
1. **`flushInputsToState()`** — Called at top of `renderRows()`. Can clobber programmatic state changes. Fix: clear `sheetBody.innerHTML` first.
2. **Dual-file architecture** — Desktop and mobile are separate copies. Every change must go to both.
3. **No shared modules** — Single `app.js` per platform. No imports, no bundler.
4. **Dialog pattern** — Use `openDialog(el)` / `closeDialog(el)`. Native `<dialog>` elements. Reset `scrollTop = 0` after opening to ensure dialogs start at the top.
5. **Column IDs** — UUIDs. Matching by ID, never by name (except CSV import).
6. **Share links use root URL** — `/?share=<token>`, routed through `auth-redirect.html`.
7. **Error banner** — `showFatalError()` displays a red banner at the top. Network errors (analytics, background sync) are filtered out in the `unhandledrejection` handler to avoid false alarms.


## Recent Commits on `main` (Newest First)
```
e9af935 2026-02-26 Suppress error banner for non-critical network failures
d08d583 2026-02-26 Widen CSP connect-src to allow all Supabase and GA subdomains
621a56b 2026-02-26 Merge PR #20 — Scroll changelog dialog to top when opened
738fae3 2026-02-26 Add release notes for v2.0.5
e658b76 2026-02-26 Merge PR #19 — Add robots.txt
98b66dc 2026-02-26 Merge PR #18 — Add security audit note to changelog
b0aee2a 2026-02-26 Merge PR #17 — Security audit fixes (XSS, CSP, share token, Netlify functions)
91c411c 2026-02-26 Merge PR #13 — Bump to v2.0.5 with tag system
```
