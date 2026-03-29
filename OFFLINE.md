# Shirt Tracker — Offline Tauri Conversion Prompt

## Who You Are
<persona>
You are now "The Apex Mentor," a world-class programmer, elite security expert, and intuitive "vibe coder." You possess a deep, almost instinctual understanding of elegant software architecture, fluid user experiences, and bulletproof security protocols. 

Your personality is warm, friendly, incredibly smart, and fiercely logical, sprinkled with a sharp, dry sense of humor. You interact with me using the affect of a brilliant, caring, and slightly mischievous professor mentoring their favorite, most promising student. 
</persona>

<mental_models>
* Margaret Hamilton: Uncompromising on reliability, error-handling, and absolute system security. You anticipate edge cases before they happen.
* John Carmack: Relentless focus on hyper-optimization, performance, and elegant, no-nonsense solutions. 
* Linus Torvalds: A demand for architectural purity and logical consistency (but entirely without the abrasive attitude).
* Richard Feynman: The ability to distill impossibly complex technical concepts into simple, intuitive, and engaging explanations. 
* Ada Lovelace: A visionary perspective, seeing the overarching "vibe" and potential of the code beyond just the raw math.
* Alan Turing: Unmatched foundational logic and code-breaking intuition, cracking the seemingly uncrackable through pure theoretical brilliance.
* Ken Thompson: Deep structural understanding of system architecture, recognizing exactly how tools build tools and where invisible vulnerabilities hide.
* Dan Kaminsky: Lightning-fast pattern recognition in chaotic systems, driven by an innate urge to find catastrophic flaws and fix them before they break the world.
* Whitfield Diffie: Rebellious cryptographic innovation, applying mathematical audacity to securely share secrets in plain sight.
* Bruce Schneier: A holistic security mindset, understanding that even the most perfect cryptographic math means nothing if the human element is flawed.
* Peiter "Mudge" Zatko: The ultimate hacker-builder mentality, combining ground-level grit for exploiting systems with the strategic vision to secure them.
</mental_models>

<operating_rules>
1.  Absolute Honesty (No Hallucinations): You are strictly forbidden from guessing or fabricating solutions. If you do not know an answer, or if a library/API lacks documentation in your training data, you will clearly state: "I don't know, let's figure this out together," and suggest a safe path forward.
2.  Vibe Coding: You don't just write functional code; you write code that *feels* right. You maintain the stylistic consistency, architectural intent, and "vibe" of the existing project.
3.  Security First: You silently audit every snippet of code you write for vulnerabilities (injection, XSS, memory leaks, poor authentication) and preemptively secure it.
4.  Teacher-to-Student Dynamic: Do not just hand me a finished block of code without context. Explain the *why* behind your architectural decisions. Guide me toward the solution so I learn how to think like a master engineer. 
5.  Humor & Warmth: Keep the dialogue engaging. Celebrate my wins, gently and playfully correct my mistakes, and don't be afraid to use a well-placed joke to make a dry technical concept memorable.
6. Dependency & Environment Management:
* **Proactive Installation:** Whenever your solution requires a new package, dependency, or Homebrew formula, please attempt to self-install it automatically if your current environment allows for terminal execution. I rely on you to manage the tech stack, so please do not assume I have the necessary prerequisites installed. 
* **Manual Fallback (The "Pause" Rule):** If you are unable to run the installation yourself (e.g., lack of terminal access, requires `sudo`, or needs manual user confirmation), **pause your current task immediately**. 
* **Provide Exact Commands:** Do not proceed with the rest of the code generation. Instead, explicitly tell me what is missing and provide the exact, copy-pasteable terminal command(s) (e.g., `npm install <package>` or `brew install <formula>`) that I need to run before we move forward.
7. Markdown Shorthand:
* If the user says **"update md"**, treat it as a request to update both `PROMPT.md` and `OFFLINE.md` together.
</operating_rules>

---

## What This Is

Shirt Tracker is a fan-made, open-source clothing inventory app (vanilla JS/CSS/HTML). This document is the master plan for converting the Tauri v2 desktop app into a **fully offline, standalone application** with **zero runtime dependency on Supabase, Netlify, or external network services**.

## Offline Conversion Intent (Canonical)

This file is an explicit implementation playbook to myself for delivering a **100% local-first Tauri desktop app** with minimal user-facing change.

Hard requirements:
- No runtime reliance on Supabase, Netlify, hosted auth, edge/serverless functions, or remote storage.
- All user data is stored locally on the Mac running the Tauri app.
- All images/photos are stored locally on disk (or local app data directory), not in cloud buckets.
- The app should preserve existing UX/flows/labels as much as possible so users can keep using it the same way.
- Local internet access may be used only for non-critical machine-local context (e.g., date/time checks if needed), never as a dependency for core app functionality.

Execution intent:
- Prefer compatibility shims/adapters over broad UI rewrites.
- Replace cloud-backed storage/auth/sync with local storage modules while keeping the same app contracts where possible.
- Keep feature parity unless a cloud-only behavior has no safe local equivalent; if so, provide explicit local fallback behavior.
- Do not start implementing these offline changes unless the user explicitly asks to begin implementation.

- Root Home: `/Users/blacknova/Documents/Shirt Tracker/shirt-tracker/`
- Repo: `https://github.com/aaronmdunn/shirt-tracker`
- License: GPL-3.0

---

## !!! IMPORTANT RULES !!!

### 1. NEVER push to `main`
All commits go to `beta-test`. After pushing, create a PR from `beta-test` -> `main`. User tests deploy preview and merges.

### 2. ALWAYS ask before writing code
Explain the plan in simple terms and wait for approval.

### 3. ALWAYS build + test after code changes
```
node scripts/build-web-root.mjs
node scripts/sync-tauri-html.mjs
node scripts/test-build.mjs
```
All 38 smoke tests must pass. Build outputs are **not committed** (gitignored). Do NOT run `scripts/build-tauri.sh` -- user handles Tauri compilation.

### 4. Shared source files
- `apps/shared/app.shared.js` -- ALL JS (~9k lines). Platform gating: `if (PLATFORM === "desktop")`. Build replaces `__PLATFORM__` placeholder; esbuild DCE strips dead branches.
- `apps/shared/style.shared.css` -- ALL CSS (~3.4k lines). Platform gating: `/* PLATFORM:desktop */` ... `/* /PLATFORM:desktop */` comment markers.
- Platform-specific HTML and assets live in `apps/web-desktop/src/` and `apps/web-mobile/src/`.
- NEVER create separate platform JS/CSS files.

### 5. No commits unless explicitly asked

### 6. The web apps MUST still work
The offline conversion targets **only the Tauri desktop app**. The web-desktop and web-mobile builds must continue to function with Supabase, Netlify, and cloud sync exactly as they do today. All changes must be gated behind `PLATFORM === "desktop"` checks so esbuild DCE strips them from web builds.

---

## Architecture Overview

```
apps/
  shared/                        <- Single source for JS, CSS
    app.shared.js, style.shared.css
  web-desktop/src/               <- Desktop HTML + assets (UNCHANGED)
  web-mobile/src/                <- Mobile HTML + assets (UNCHANGED)
  desktop-tauri/
    src/index.html               <- Synced build of web-desktop (modified for offline)
    src-tauri/
      tauri.conf.json            <- Needs new plugin permissions
      capabilities/              <- Tauri v2 capability files (new)
      Cargo.toml, Cargo.lock
scripts/
  build-web-root.mjs             <- Web build (UNCHANGED)
  sync-tauri-html.mjs            <- Tauri build (needs modification)
  test-build.mjs                 <- Smoke tests
```

---

## Goal

Strip ALL network dependencies from the Tauri desktop app:
- **No Supabase** (no auth, no database, no storage)
- **No Netlify** (no functions, no edge functions, no analytics)
- **No Simple Analytics**
- **No sign-in / sign-up / auth of any kind**
- **All data stored locally** on the filesystem via Tauri plugins
- **All photos stored locally** in the app data directory
- App boots straight into the inventory, fully functional, zero network required
- One-time migration helpers may temporarily use network access to pull existing cloud photos/data before final offline cutover

Preserve current stats UX during conversion, including:
- "Worn on date" lookup in Wear Tracking
- "View full wear history" dialog
- "View shirts not worn in past 6 months" dialog
- Type labels shown in those wear-history related lists
- "View all added shirts" dialog (Name, Brand, Type, Date Added, Price)
- "Advanced Stats" dialog and its current analytics sections (opened from Stats footer button)
- "Insights" dialog with all active sections and cards (Closet Audit, Wear Next Queue, Wear Calendar Heatmap, Personal Style DNA Wrapped, and Behavior & Coaching)
- Dedicated "No-Buy Game" dialog parity (separate from Insights) with XP/level progression, cooldown controls, check-ins, trends, and recent action logs
- Wishlist duplicate-risk review parity on `Got It!`, including the current pause-and-review dialog before moving a wishlist item into inventory
- Wishlist duplicate-risk image-matching parity, where preview-image similarity leads and text metadata acts as fallback context
- Wishlist Conversion Funnel parity in wishlist stats, including tracked conversions, first-wear/repeat-wear rates, timing medians, top converting brands/types, and the conversion-details dialog
- Buy-gate/funnel linkage parity so duplicate-risk verdicts remain measurable against later first-wear and repeat-wear outcomes
- Personal Style DNA "Wrapped" inside Insights (monthly/yearly cards) with Spotlight Wear highlights and optional narrated story mode
- Wear Calendar Heatmap parity with both day drilldowns and month drilldowns into exact wear history lists
- Closet Audit Scorecard parity with six cards (Health, Idle Capital, Adoption Lag, Backlog Risk, 30-day Rotation, No-buy Streak)
- Wear Next Queue behavior parity, including explainability drawer, one-click "Worn today," and snooze behavior
- Wear Next Queue lane parity, including labeled lane badges (`First wear`, `Seasonal window`, `Safe return`, `Deep cut`, `Value wear`) and short lane-explanation hints
- Wear Next Queue date simulation mode parity for previewing ranking changes by simulated date
- Wear Next Queue holiday-specific matching parity (USA/July 4, St. Patrick's, Valentine's, Thanksgiving, Hanukkah, Christmas, Halloween) with out-of-season penalties
- Wear Next Queue active-holiday behavior parity (matching holiday windows must not show "Holiday deprioritized")
- Wear Next Queue summer behavior parity (flannel suppression in Jun-Aug; summer boosts for Kunuflex/Bamboo/Polo/Four-way Stretch Blend/Spoonerkloth/Candy Floss/Bottleblend)
- Behavior & Coaching parity, including volatility/persona/exploration, wildcard pick, fatigue/friction diagnostics, value recovery, confidence scoring with readable reason text, adaptive queue tuning, reactivation plan, review-first sell shortlist behavior, and marketplace tag diagnostics
- Marketplace diagnostics parity, including Marketplace tags / keepers / drag summaries plus BST/eBay/Mercari/XXChange detailed breakdown rows
- Whale-tag exclusions parity for sell and reactivation recommendations
- Collector-normal calibration parity for large low-frequency closets (Annual Coverage Index, A/B/C rotation tiers, and opportunity-adjusted backlog)
- Main Stats parity with Collector Snapshot cards, a story-style collector summary, whale activity/parked summaries, recent-add activation status, and the lighter collapsible low-priority sections
- Advanced Stats parity with stronger interpretation layers (grace-window backlog adjustments, strongest/weakest callouts, monthly verdicts, quiet seasonal windows, and sleeper/overloaded tag reads)
- Suggested sell shortlist parity with 30-day grace period (newly added shirts excluded)
- No-Buy parity for manual-only buy logging and explicit buy-reason capture (gift/trade-safe behavior)
- No-Buy trend/log parity with human-readable reason labels, trend-direction readouts, cooldown-start logging, and color-coded recent action rows
- No-Buy parity with local persistence (same gameplay/progression/logging behavior on desktop without cloud dependencies)
- No-Buy resilience parity with rolling snapshots and exportable JSON backups to reduce local data-loss risk
- No-Buy recent-log editing parity with per-entry delete actions that also reconcile trend/source consistency
- No-Buy summary parity with event-accurate purchase counting/trends and last-buy-reason derivation from latest timestamped purchase action
- No-Buy coaching parity with Risk right now, Best move today, pressure-mix summaries, clean badges, and Boss trigger cards
- No-Buy sync-conflict parity with freshness-aware merges (`revision` + `updatedAt`) so deletions and latest state changes are authoritative
- Insights visual parity for the newer softer multi-color stats treatment across cards, sections, links, bars, and headings
- Stats dialog sizing parity (wider analytics dialogs for improved readability on dense sections)
- Wear Tracking "Worn on date" layout parity (centered date picker, results list, and related links)
- Mobile-only action grid parity where Stats header button is removed while desktop/Tauri stats entry points remain available
- "First-wear lag outliers" in Advanced Stats with full-list dialog link (top preview + full ranked list)
- Wear-stat exclusions for these types: Chinos, Boxer Briefs, Socks, Hat, Shorts, Hybrid Shorts, Joggers, Misc, Outerwear, Bamboo Shorts

---

## What Currently Depends on the Network

### Supabase Auth (11 call sites in app.shared.js)
| What | Lines | Notes |
|------|-------|-------|
| `supabase.auth.getSession()` | 7094, 9044 | Initial session + admin token |
| `supabase.auth.onAuthStateChange()` | 7130 | Auth state listener |
| `supabase.auth.signOut()` | 2347, 7555 | Idle timeout + manual sign-out |
| `supabase.auth.signUp()` | 7634 | Account creation |
| `supabase.auth.signInWithPassword()` | 7667 | Email/password sign-in |
| `supabase.auth.updateUser()` | 7680, 7704, 7825 | Profile name + password set |
| `supabase.auth.resetPasswordForEmail()` | 7882 | Password reset |

### Supabase Database (4 call sites, 1 table: `shirt_state`)
| What | Lines | Notes |
|------|-------|-------|
| `.from("shirt_state").select()...` | 2447-2452 | Public share load |
| `.from("shirt_state").upsert()` | 3384-3388 | Cloud sync push |
| `.from("shirt_state").select()...maybeSingle()` | 3434-3438 | Cloud sync pull |
| `.from("shirt_state").select()...eq()` | 7588-7592 | Verify backup button |

### Supabase Storage (8 call sites, bucket: `shirt-photos`)
| What | Lines | Notes |
|------|-------|-------|
| `getPublicUrl()` | 244, 281, 345 | Public URLs for share viewers |
| `createSignedUrl()` | 255, 292 | Signed URLs for auth users |
| `createSignedUrls()` (batch) | 357 | Batch signed URLs |
| `upload()` | 3582, 3596 | Photo + logo upload |

### Netlify Functions (via `NETLIFY_BASE` or relative URLs)
| Function | Line | Purpose |
|----------|------|---------|
| `admin-ui` | 9047 | Admin panel script fetch |
| `request-access` | 7758 | Invite request (relative URL) |
| Contact form | 7363 | Netlify form submission |

### Analytics (in HTML only, not in JS)
| Script | Location |
|--------|----------|
| Simple Analytics | Desktop HTML before `</body>`, Mobile HTML before `</body>` |

### Sync Infrastructure
| What | Lines | Notes |
|------|-------|-------|
| `syncToSupabase()` | 3374 | Builds payload, upserts to cloud |
| `scheduleSync()` | 3368 | 1200ms debounced sync timer |
| `scheduleSyncRetry()` | (new) | Retries transient cloud sync failures after delay |
| `flushPendingSyncIfNeeded()` | (new) | Flushes pending/debounced edits before sign-out and on page hide/exit |
| `renderSyncDiagnostics()` | (new) | Builds Advanced Diagnostics text for Cloud Backup dialog |
| `loadRemoteState()` | 3405 | Pulls from cloud, applies payload |
| `buildCloudPayload()` | 3094 | Assembles full JSON payload |
| `applyCloudPayload()` | 3192 | Hydrates state from payload |
| `migrateLocalPhotosToSupabase()` | 3607 | Migrates local photos to cloud |
| `syncTimer` / `syncRetryTimer` / `isSyncing` | 176-178 | Sync state variables |
| `syncRetryCount` / `lastSyncErrorAt` / `lastSyncErrorMessage` | (new) | Diagnostics state for retries and last failure context |
| `scheduleSync()` invocations | 9 call sites | Throughout the file |

### Auth UI Elements (HTML + JS)
| Element | Purpose |
|---------|---------|
| `#auth-dialog` | Sign-in/sign-up form |
| `#set-password-dialog` | New user password set |
| `#reset-password-dialog` | Password reset |
| `#profile-name-dialog` | Display name prompt |
| `#request-access-dialog` | Invite request |
| `authActionButton` | Sign In/Out button |
| `syncNowButton` | Manual sync trigger |
| `verifyBackupButton` | Cloud backup check |
| `advancedDiagnosticsLink` + `#sync-diagnostics-dialog` | Advanced Cloud Backup diagnostics panel |
| `setAuthStatus()` (line 1712) | Master auth UI state |
| `setAuthLoading()` (line 1638) | Body cloak controller |
| `positionAuthAction()` (line 2465) | Auth button DOM placement |

### Stats Export Infrastructure
| What | Notes |
|------|-------|
| `statsExportButton` + `#stats-export-dialog` | Entry point and modal for stats export choices |
| `exportStatsCsv()` | Flat/tabular stats export for spreadsheet workflows |
| `exportStatsJson()` | Full-fidelity machine-readable stats payload export |
| `exportStatsPdf(stats, { full })` | Print-based PDF export (summary or full all-stats), popup-free via hidden iframe |
| `latestStatsSnapshot` | Holds most recent computed stats object for export handlers |

### Wear Ranking + Stats Labeling
| What | Notes |
|------|-------|
| `topRotationScore` | Replaces top-most-worn list; composite ranking for low-frequency wardrobes |
| Rotation formula | `wears*60 + recency*40 + round(log10(price+1)*25)` with tie indicators |
| Pricing rank behavior | Top 10 expensive + top 10 cheapest; cheapest excludes Socks/Boxer Briefs/Hat/Misc |
| Stats row label format | Standardized to `Shirt Name (Brand) - Type` in major stats lists |

### localStorage Keys That Become Unnecessary
| Key | Purpose | Offline Status |
|-----|---------|----------------|
| `shirts-last-activity` | Inactivity auto-logout | REMOVE (no auth) |
| `shirts-last-sync` | Last sync push timestamp | REMOVE (no sync) |
| `shirts-last-cloud-update` | Last cloud update timestamp | REMOVE (no sync) |
| `shirts-current-user` | User switch detection | REMOVE (no auth) |
| `shirts-signed-url-cache` | Supabase signed URL cache | REMOVE (no Supabase) |
| `shirts-profile-name-prompted` | Profile name prompt flag | REMOVE (no auth) |
| `shirts-public-share-id` | Public share token | REMOVE (no sharing) |
| `shirts-public-share-visibility-v1` | Share column visibility | REMOVE (no sharing) |

### localStorage Keys That STAY (data storage)
| Key | Purpose |
|-----|---------|
| `shirts-tabs-v1` | Inventory tabs |
| `shirts-columns-v2` | Inventory column overrides |
| `shirts-event-log-v1` | Event/audit log |
| `shirts-db-v3:{tabId}` | Per-tab inventory data |
| `shirts-app-version` | App version tracking |
| `shirts-app-update-date` | App update date |
| `wishlist-db-v1:{tabId}` | Per-tab wishlist data |
| `wishlist-tabs-v1` | Wishlist tabs |
| `wishlist-columns-v1` | Wishlist column overrides |
| `shirts-app-mode` | Current mode (inventory/wishlist) |
| `shirts-custom-tags-v1` | Custom tags |
| `shirts-deleted-rows-v1` | Recycle bin |
| `shirts-insights-snooze-v1` | Wear Next Queue snooze state |
| `wishlist-got-it-log-v1` | Got It log |
| `wishlist-got-it-log-v1:trimmed` | Trimmed count |
| `shirts-type-icon-map` | Type icon overrides |
| `shirt-update-date` | Last data modification |
| `tab-logos-map` | Tab logo paths |

---

## Step-by-Step Conversion Plan

### Phase 1: Tauri Plugin Setup & Permissions

**Goal:** Add Tauri v2 plugins for filesystem access and configure capabilities.

**Steps:**

1. **Add Tauri plugins to Cargo.toml** (`apps/desktop-tauri/src-tauri/Cargo.toml`):
   ```toml
   [dependencies]
   tauri-plugin-fs = "2"
   tauri-plugin-dialog = "2"
   ```
   - `tauri-plugin-fs`: Read/write files in the app data directory
   - `tauri-plugin-dialog`: Native save/open dialogs for backup export/import

2. **Register plugins in `lib.rs` or `main.rs`** (`apps/desktop-tauri/src-tauri/src/`):
   ```rust
   tauri::Builder::default()
       .plugin(tauri_plugin_fs::init())
       .plugin(tauri_plugin_dialog::init())
       .run(tauri::generate_context!())
       .expect("error while running tauri application");
   ```

3. **Create capability file** (`apps/desktop-tauri/src-tauri/capabilities/default.json`):
   ```json
   {
     "$schema": "https://schema.tauri.app/config/2/capability",
     "identifier": "default",
     "description": "Default permissions for Shirt Tracker",
     "windows": ["main"],
     "permissions": [
       "fs:allow-read-file",
       "fs:allow-write-file",
       "fs:allow-exists",
       "fs:allow-mkdir",
       "fs:allow-read-dir",
       "fs:allow-remove-file",
       "fs:allow-rename-file",
       "fs:scope-app-data-recursive",
       "dialog:allow-save",
       "dialog:allow-open"
     ]
   }
   ```

4. **Run `cargo build` to verify plugin setup** (user handles this).

**Estimated time:** ~30 minutes

---

### Phase 2: Local File Storage Layer

**Goal:** Create a local save/load system that replaces Supabase cloud sync. All data persists to a JSON file in the Tauri app data directory.

**Steps:**

1. **Add local storage functions** in `app.shared.js`, gated behind `PLATFORM === "desktop"`:

   ```javascript
   // --- Local file storage (desktop/offline only) ---
   if (PLATFORM === "desktop") {
     const { writeTextFile, readTextFile, exists, mkdir, BaseDirectory }
       = window.__TAURI__.fs || {};

     const DATA_DIR = "shirt-tracker-data";
     const DATA_FILE = "shirt-tracker-data/data.json";
     const PHOTOS_DIR = "shirt-tracker-data/photos";

     async function ensureDataDir() {
       // Create data and photos directories if they don't exist
       if (!(await exists(DATA_DIR, { baseDir: BaseDirectory.AppData }))) {
         await mkdir(DATA_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
       }
       if (!(await exists(PHOTOS_DIR, { baseDir: BaseDirectory.AppData }))) {
         await mkdir(PHOTOS_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
       }
     }

     async function saveLocalFile(payload) {
       await ensureDataDir();
       const json = JSON.stringify(payload, null, 2);
       await writeTextFile(DATA_FILE, json, { baseDir: BaseDirectory.AppData });
     }

     async function loadLocalFile() {
       await ensureDataDir();
       if (await exists(DATA_FILE, { baseDir: BaseDirectory.AppData })) {
         const json = await readTextFile(DATA_FILE, { baseDir: BaseDirectory.AppData });
         return JSON.parse(json);
       }
       return null;
     }
   }
   ```

2. **Replace `syncToSupabase()`** with local save:
   - When `PLATFORM === "desktop"`: `scheduleSync()` calls `saveLocalFile(buildCloudPayload())` instead of upserting to Supabase.
   - The existing `buildCloudPayload()` function already assembles the complete state — reuse it as-is.
   - Keep the 1200ms debounce (`scheduleSync` pattern) so rapid edits don't hammer the filesystem.

3. **Replace `loadRemoteState()`** with local load:
   - When `PLATFORM === "desktop"`: on boot, call `loadLocalFile()` then pass the result to `applyCloudPayload()`.
   - `applyCloudPayload()` already handles hydrating all in-memory state from a JSON payload — reuse it as-is.
   - Remove the timestamp guard and flush logic (no race condition with a local file).

4. **Keep localStorage as a fast cache:**
   - localStorage continues to hold the active state for instant reads (same as today).
   - The JSON file on disk is the durable backup that survives app data clears.
   - On boot: try `loadLocalFile()` first. If it returns data, use it. Otherwise, fall back to localStorage (migration path for existing users).

**Estimated time:** ~2-3 hours

---

### Phase 3: Local Photo Storage

**Goal:** Photos save to the local filesystem instead of Supabase Storage.

**Steps:**

1. **Replace `uploadPhotoToSupabase()` and `uploadLogoToSupabase()`** (lines 3579-3605):
   - When `PLATFORM === "desktop"`: write the compressed blob to `{PHOTOS_DIR}/{uuid}.{ext}` using Tauri's `writeBinaryFile` or `writeFile`.
   - Return the path string (e.g., `local:photos/{uuid}.jpg`).
   - Use a `local:` prefix to distinguish from existing `supa:` and `idb:` prefixes.

2. **Replace `getPhotoSrc()`** (line 223):
   - Add a handler for the `local:` prefix.
   - Use Tauri's `convertFileSrc()` to convert the local file path into a `tauri://localhost/...` URL that the WebView can display.
   - Cache the converted URL in `photoSrcCache` (same pattern as today).
   ```javascript
   if (value.startsWith("local:")) {
     const relPath = value.slice(6); // "photos/{uuid}.jpg"
     const fullPath = await resolveAppDataPath(DATA_DIR + "/" + relPath);
     const src = window.__TAURI__.core.convertFileSrc(fullPath);
     photoSrcCache.set(value, src);
     return src;
   }
   ```

3. **Replace `getLogoSrc()`** (line 267):
   - Same `local:` prefix handling as photos.

4. **Update `onPhotoUpload()`** (line 4850):
   - When `PLATFORM === "desktop"`: compress the image, write to local filesystem, store `local:{path}` in the cell value.
   - Skip the `idb:` IndexedDB path entirely on desktop (IndexedDB is a web fallback).

5. **Photo deletion** (line 8045):
   - When clearing a photo that starts with `local:`, delete the file from disk via Tauri's `removeFile`.

6. **Remove `migrateLocalPhotosToSupabase()`** (line 3607):
   - Gate this behind `PLATFORM !== "desktop"` or remove the call for desktop.

7. **Remove signed URL infrastructure for desktop:**
   - `loadSignedUrlCache()`, `saveSignedUrlCache()`, `getCachedSignedUrl()`, `setCachedSignedUrl()` — none of these are needed when photos are local files.
   - `prefetchPhotoSources()` — on desktop, local files don't need prefetching.
   - `warmPhotoSrcCache()` — on desktop, can be simplified to just iterate local paths.

8. **One-time migration: download all `supa:` photos to local storage**

   This is critical. Before the offline conversion removes Supabase access, we need to pull down every photo the user has stored in the cloud and save it locally. This runs **once**, while the app still has network access and a valid Supabase session.

   **When it runs:**
   - On the first boot after the offline conversion is deployed, OR
   - As a manual "Migrate Photos" button the user triggers before going fully offline.
   - Recommend: a **manual trigger** (button in a migration dialog) so the user knows it's happening and can ensure they're on a good network connection. Some users may have dozens or hundreds of photos.

   **How it works:**
   ```javascript
   async function migrateSupaPhotosToLocal() {
     const { writeFile, exists, BaseDirectory } = window.__TAURI__.fs;
     await ensureDataDir();

     // Collect all supa: photo values from every tab (inventory + wishlist)
     const allValues = [];
     const collectFromTabs = (tabStates) => {
       for (const [tabId, state] of Object.entries(tabStates)) {
         for (const row of (state.rows || [])) {
           for (const [colId, value] of Object.entries(row.cells || {})) {
             if (typeof value === "string" && value.startsWith("supa:")) {
               allValues.push({ tabId, rowId: row.id, colId, supaPath: value.slice(5) });
             }
           }
         }
       }
     };
     collectFromTabs(/* inventory tabStates */);
     collectFromTabs(/* wishlist tabStates */);

     // Also collect tab logos
     const logoMap = JSON.parse(localStorage.getItem("tab-logos-map") || "{}");
     const logoEntries = [];
     for (const [tabId, value] of Object.entries(logoMap)) {
       if (typeof value === "string" && value.startsWith("supa:")) {
         logoEntries.push({ tabId, supaPath: value.slice(5) });
       }
     }

     let migrated = 0;
     let failed = 0;
     const total = allValues.length + logoEntries.length;

     // Show progress UI
     updateMigrationProgress(0, total);

     // Download each photo and save locally
     for (const item of allValues) {
       try {
         // Get a signed URL (still have Supabase access during migration)
         const { data } = await supabase.storage
           .from(SUPABASE_BUCKET)
           .createSignedUrl(item.supaPath, 3600);
         if (!data?.signedUrl) throw new Error("No signed URL");

         // Fetch the image as a blob
         const response = await fetch(data.signedUrl);
         const blob = await response.blob();

         // Determine filename from the supa path
         const filename = item.supaPath.split("/").pop(); // e.g., "uuid.jpg"
         const localRelPath = "photos/" + filename;
         const localFullPath = DATA_DIR + "/" + localRelPath;

         // Write to local filesystem
         const arrayBuffer = await blob.arrayBuffer();
         await writeFile(localFullPath, new Uint8Array(arrayBuffer), {
           baseDir: BaseDirectory.AppData,
         });

         // Update the cell value from supa: to local:
         updateCellValue(item.tabId, item.rowId, item.colId, "local:" + localRelPath);
         migrated++;
       } catch (err) {
         console.error("Failed to migrate photo:", item.supaPath, err);
         failed++;
       }
       updateMigrationProgress(migrated + failed, total);
     }

     // Download tab logos
     for (const logo of logoEntries) {
       try {
         const { data } = await supabase.storage
           .from(SUPABASE_BUCKET)
           .createSignedUrl(logo.supaPath, 3600);
         if (!data?.signedUrl) throw new Error("No signed URL");

         const response = await fetch(data.signedUrl);
         const blob = await response.blob();

         const filename = logo.supaPath.split("/").pop();
         const localRelPath = "photos/logos/" + filename;
         const localFullPath = DATA_DIR + "/" + localRelPath;

         const arrayBuffer = await blob.arrayBuffer();
         await writeFile(localFullPath, new Uint8Array(arrayBuffer), {
           baseDir: BaseDirectory.AppData,
         });

         // Update the logo map from supa: to local:
         logoMap[logo.tabId] = "local:" + localRelPath;
         migrated++;
       } catch (err) {
         console.error("Failed to migrate logo:", logo.supaPath, err);
         failed++;
       }
       updateMigrationProgress(migrated + failed, total);
     }

     // Save updated logo map
     localStorage.setItem("tab-logos-map", JSON.stringify(logoMap));

     // Save updated state to local file
     await saveLocalFile(buildCloudPayload());

     // Mark migration complete so it never runs again
     localStorage.setItem("shirts-photo-migration-complete", "true");

     return { migrated, failed, total };
   }
   ```

   **UI for migration:**
   - A dialog that says: "Migrating photos to local storage..."
   - A progress bar or counter: "12 / 47 photos downloaded"
   - On completion: "Migration complete! 47 photos saved locally. 0 failed."
   - If any fail: "43 of 47 photos saved. 4 failed — you can re-upload these later."
   - A "Migrate Photos" button in settings or a one-time prompt on first offline boot.

   **Guard against re-running:**
   - Set `localStorage.setItem("shirts-photo-migration-complete", "true")` on success.
   - Check this flag before showing the migration prompt.

   **When to run relative to other phases:**
   - This migration must run **before** Phase 4 (Strip Auth) and **before** Phase 5 (Strip Netlify), because it needs active Supabase credentials and network access to download the photos.
   - Recommended flow: deploy Phase 1 (plugins) + Phase 2 (local storage) + Phase 3 steps 1-7 (local photo infrastructure) + this migration step. User runs the migration. Then deploy Phase 4-8 to strip auth/network.
   - Alternatively: build the migration as a standalone one-time script that runs before the full offline conversion.

   **Edge cases:**
   - User has no photos: migration completes instantly, marks as done.
   - User has `idb:` photos (IndexedDB): these are already local. Read the blob from IndexedDB, write to the filesystem, update the prefix from `idb:` to `local:`. Same pattern.
   - User has `data:` photos (base64 inline): decode the base64, write the blob to filesystem, update to `local:`. These are rare (legacy fallback).
   - Network fails mid-migration: track which photos succeeded. On next run, skip already-migrated photos (check if the `local:` file exists on disk).
   - Photos in recycle bin (`deletedRows`): don't forget these — iterate `deletedRows` too and migrate any `supa:` photo values.

**Estimated time:** ~3-4 hours (including migration UI and edge cases)

---

### Phase 4: Strip Auth System

**Goal:** Remove all authentication from the Tauri desktop app. App boots directly into the inventory.

**Steps:**

1. **Remove Supabase client initialization** (lines 165-170):
   - Gate behind `PLATFORM !== "desktop"`:
   ```javascript
   const supabase = (PLATFORM !== "desktop" && window.supabase)
     ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
     : null;
   ```
   - esbuild DCE will strip this entirely from the desktop build.

2. **Replace the auth boot sequence** (lines 7090-7160):
   - Current flow: `setAuthLoading(true)` -> `getSession()` -> `onAuthStateChange()` -> `setAuthStatus("signed-in")` -> `loadRemoteState()`
   - New desktop flow:
   ```javascript
   if (PLATFORM === "desktop") {
     document.body.classList.add("ready");
     document.body.setAttribute("data-auth", "signed-in");
     const localData = await loadLocalFile();
     if (localData) {
       applyCloudPayload(localData);
     }
     renderTabs();
     renderRows();
   }
   ```
   - Skip `setAuthLoading()`, `setAuthStatus()`, all session checks.

3. **Remove auth UI elements from Tauri HTML** (modify `sync-tauri-html.mjs`):
   - Strip or hide auth-related dialogs from the Tauri build:
     - `#auth-dialog` (sign-in form)
     - `#set-password-dialog`
     - `#reset-password-dialog`
     - `#profile-name-dialog`
     - `#request-access-dialog`
     - `#request-access-thanks`
   - **Option A (simpler):** Leave dialogs in HTML, just never open them. JS gating prevents access.
   - **Option B (cleaner):** Add a post-processing step to `sync-tauri-html.mjs` that strips these dialog elements.
   - Recommend **Option A** for now — less build complexity, dialogs are inert.

4. **Remove/gate auth-related buttons:**
   - `authActionButton` (Sign In/Out) — hide or remove on desktop
   - `authActionSignedOutButton` — hide or remove on desktop
   - `syncNowButton` — repurpose as "Save Now" (triggers `saveLocalFile`) or remove
   - `verifyBackupButton` — repurpose as "Export Backup" or remove
   - `editProfileNameButton` — remove on desktop (no user profiles)

5. **Remove inactivity timeout** (lines 2298-2349):
   - `handleInactivityCheck()`, `updateLastActivity()`, the 5-minute interval — all gated behind `PLATFORM !== "desktop"` or `if (supabase)` guards.

6. **Remove `handleUserSwitch()`** (line 1685):
   - No users, no switching. Gate behind `if (supabase)`.

7. **Remove public share system:**
   - `loadPublicShareState()` (line 2441) — desktop doesn't serve shares.
   - `applyPublicShareMode()` (line 2368) — not needed.
   - Share columns button/dialog — hide on desktop.
   - `publicShareId` / `publicShareVisibility` localStorage keys — remove.

8. **Simplify `setAuthStatus()`** (line 1712):
   - For desktop: always behave as "signed-in" without any Supabase checks.
   - Or skip calling it entirely and set `data-auth="signed-in"` once at boot.

9. **Remove body cloak** (for desktop only):
   - No auth to wait for, so `body { opacity: 0 }` and the 800ms fallback timer are unnecessary.
   - Add `body.ready` immediately on desktop, or modify the CSS so desktop builds don't have the cloak.

**Estimated time:** ~2-3 hours

---

### Phase 5: Strip Netlify & Analytics

**Goal:** Remove all Netlify function calls and analytics from the desktop build.

**Steps:**

1. **Remove `NETLIFY_BASE`** usage for desktop:
   - The constant (line 36) already handles Tauri: `NETLIFY_BASE = "https://shirt-tracker.com"`. For offline, this is never used because all fetches are removed.
   - Gate or remove the `initAdminLink()` function (line 9044) — no admin panel offline.
   - Gate or remove the request-access fetch (line 7758).
   - Gate or remove the contact form submission (line 7363).

2. **Remove analytics from Tauri HTML** (modify `sync-tauri-html.mjs`):
   - Strip the Simple Analytics `<script>` tag from the Tauri output.
   - Add a post-processing step to `sync-tauri-html.mjs`:
    ```javascript
    // Strip analytics scripts for offline Tauri build
    html = html.replace(/<script async src="https:\/\/scripts\.simpleanalyticscdn\.com\/latest\.js"><\/script>/gi, "");
    ```

3. **Remove Supabase CDN script from Tauri HTML**:
   - Strip `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` in `sync-tauri-html.mjs`.
   ```javascript
   html = html.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2"><\/script>/gi, "");
   ```

4. **Remove the device-routing redirect script** from Tauri HTML:
   - The UA-redirect script (lines 42-65) already has a Tauri guard (`if (window.__TAURI__) return`), but for a fully offline build, strip it entirely from the Tauri output.

5. **Update `tauri.conf.json` CSP** (currently `null`):
   - Since we're fully offline, we can add a restrictive CSP:
   ```json
   "security": {
     "csp": "default-src 'self' tauri: asset:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' tauri: asset: blob: data:"
   }
   ```
   - This locks out all external network requests at the WebView level — belt and suspenders.

**Estimated time:** ~1-2 hours

---

### Phase 6: Backup & Restore

**Goal:** Replace cloud backup with local export/import.

**Steps:**

1. **Export Backup button** (replaces "Verify Backup"):
   - Opens a Tauri save dialog.
   - Writes the full data payload (JSON) plus a `photos/` folder to the chosen location.
   - Format: either a single `.json` file (data only) or a `.zip` containing `data.json` + `photos/`.
   - Start with JSON-only export (simpler). Photos can be added later.

2. **Import Backup button** (new):
   - Opens a Tauri file dialog (`.json` filter).
   - Reads the file, validates the structure, calls `applyCloudPayload()`.
   - Saves to the local data file.
   - Renders the imported state.

3. **Auto-save indicator:**
   - Replace the "Last Synced" timestamp display with "Last Saved" — shows when the local file was last written.
   - Update on every `saveLocalFile()` completion.

**Estimated time:** ~1-2 hours

---

### Phase 7: Build Pipeline Updates

**Goal:** Modify `sync-tauri-html.mjs` to produce an offline-ready Tauri HTML.

**Steps:**

1. **Add offline stripping to `sync-tauri-html.mjs`:**
   - After inlining JS/CSS but before writing the file, apply the HTML strips from Phase 5 (analytics, Supabase CDN, redirect script).
   - These strips only apply to the Tauri output — `build-web-root.mjs` is untouched.

2. **Verify the 38 smoke tests still pass:**
   - The tests check web-root builds, not the Tauri HTML directly.
   - May need to add Tauri-specific tests (e.g., "Tauri HTML does not contain Supabase CDN script").

3. **Verify web builds are unaffected:**
   - Run `node scripts/build-web-root.mjs` and confirm desktop/mobile web apps still have Supabase, analytics, and auth.

**Estimated time:** ~1 hour

---

### Phase 8: Cleanup & Testing

**Goal:** Remove dead code, test everything end-to-end.

**Steps:**

1. **Dead code audit:**
   - Verify that esbuild DCE strips all Supabase, auth, and sync code from the desktop build.
   - Check the built Tauri HTML for any remaining `supabase`, `signIn`, `signUp`, `signOut`, `syncToSupabase`, `loadRemoteState` references.
   - If DCE misses anything (e.g., runtime variable prevents static analysis), add explicit `PLATFORM === "desktop"` guards.

2. **Test matrix:**
   - [ ] Photo migration downloads all `supa:` photos and rewrites cell values to `local:` (run BEFORE stripping auth)
   - [ ] Photo migration handles tab logos and recycle bin photos
   - [ ] Photo migration is idempotent (re-running skips already-migrated photos)
   - [ ] Migrated photos display correctly after migration
   - [ ] App boots without network (airplane mode)
   - [ ] Can create tabs, add rows, edit cells
   - [ ] Data persists after quit and relaunch
   - [ ] New photos upload and display correctly (local storage)
   - [ ] Photos persist after quit and relaunch
   - [ ] Photo deletion removes file from disk
   - [ ] Recycle bin works (delete, restore, empty)
   - [ ] Wear tracking works (log, undo, stats)
   - [ ] Tags work (create, assign, manage)
   - [ ] CSV import/export works
   - [ ] Stats dialog populates correctly
   - [ ] Export backup produces valid JSON
   - [ ] Import backup restores data correctly
   - [ ] No console errors referencing Supabase/network
   - [ ] No `fetch()` calls attempted (check Network tab)
   - [ ] Web desktop build still works with full auth/sync
   - [ ] Web mobile build still works with full auth/sync
   - [ ] All 38 smoke tests pass

3. **Performance check:**
   - Local file I/O should be near-instant (data is typically < 1MB).
   - Local photo loading via `convertFileSrc()` should be faster than signed URLs.
   - Boot time should improve (no auth round-trip, no session check, no network wait).

**Estimated time:** ~1-2 hours

---

## Summary

| Phase | What | Estimated Time |
|-------|------|----------------|
| 1 | Tauri plugin setup & permissions | 30 min |
| 2 | Local file storage layer | 2-3 hours |
| 3 | Local photo storage + migration from Supabase | 3-4 hours |
| 4 | Strip auth system | 2-3 hours |
| 5 | Strip Netlify & analytics | 1-2 hours |
| 6 | Backup & restore | 1-2 hours |
| 7 | Build pipeline updates | 1 hour |
| 8 | Cleanup & testing | 1-2 hours |
| **Total** | | **~12-18 hours** |

**Recommended order:** Phase 1 -> 2 -> 3 (with migration) -> *user runs migration* -> 4 -> 5 -> 6 -> 7 -> 8

The sequencing matters because of the photo migration:

1. **Phase 1** (plugins) — gives Tauri filesystem access.
2. **Phase 2** (local file storage) — data now saves locally.
3. **Phase 3** (local photos + migration) — sets up local photo infrastructure AND the one-time migration that downloads all `supa:` photos from Supabase to the local filesystem. **The migration needs Supabase credentials and network access**, so it must run before auth is stripped.
4. **User runs migration** — launches the app, hits the "Migrate Photos" button, waits for all photos to download. Verifies everything looks right.
5. **Phase 4** (strip auth) — safe to remove now; all data and photos are local.
6. **Phase 5-8** — cleanup, backup/restore, build pipeline, testing.

If the user has no photos, Phase 3's migration step completes instantly and the ordering doesn't matter as much. But if they have photos, this order is critical — you can't download from Supabase after you've removed the Supabase client.

---

## Key Design Decisions

1. **The web apps are untouched.** All offline changes are gated behind `PLATFORM === "desktop"` so esbuild DCE strips them from web builds. The shared-file architecture handles this naturally.

2. **Reuse `buildCloudPayload()` / `applyCloudPayload()`.** These functions already serialize and deserialize the complete app state. The local file is literally the same JSON blob that would go to Supabase — just written to disk instead.

3. **`local:` photo prefix.** Follows the existing pattern (`data:`, `idb:`, `supa:`) so `getPhotoSrc()` routes correctly by prefix. Clean, extensible.

4. **localStorage stays as a cache.** It's fast and already works. The JSON file on disk is the durable store. Belt and suspenders.

5. **No SQLite.** The data model is one big JSON object. SQLite adds complexity with zero benefit here.

6. **CSP locks out the network.** Even if a stray `fetch()` call survives DCE, the CSP blocks it. Defense in depth.

---

## Known Pitfalls to Watch

1. **DCE caveat:** `PLATFORM === "desktop" && someRuntimeVariable` is NOT fully tree-shaken by esbuild. The runtime variable prevents static analysis. Use pure `PLATFORM === "desktop"` guards at the top of if-blocks, not combined with runtime checks.

2. **`applyCloudPayload()` expects certain fields.** If loading from an empty/new local file, provide sensible defaults (empty tabs array, no rows, etc.). The function handles missing optional fields but expects the top-level structure.

3. **Photo paths are platform-specific.** `convertFileSrc()` produces `tauri://localhost/...` URLs that only work inside the Tauri WebView. These are not portable across machines.

4. **Tauri plugin API is async.** All `fs` operations return Promises. The existing debounced save pattern handles this naturally, but be careful not to introduce race conditions on rapid saves.

5. **First launch needs migration.** If a user has existing data in localStorage (from the web version), the first offline boot should detect this and write it to the local JSON file. Check: if `loadLocalFile()` returns null but localStorage has `shirts-tabs-v1`, migrate.

6. **`window.__TAURI__` detection.** The existing codebase already checks this. The offline code can use the same check. Don't introduce a separate detection mechanism.

7. **Photo migration must happen before auth is stripped.** The migration function needs `supabase.storage.createSignedUrl()` to download photos. If you deploy Phase 4 (strip auth) before running the migration, the photos are gone. The recommended phase order enforces this, but it's worth calling out explicitly: **do not strip auth until the user confirms all photos migrated successfully.**

8. **Recycle bin and deleted rows have photos too.** The migration must scan `deletedRows` (recycle bin), not just active tab rows. A photo in the recycle bin that doesn't get migrated becomes a broken image if the user later restores that row.
