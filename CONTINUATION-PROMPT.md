# Shirt Tracker — Continuation Prompt

## What This Is


Shirt Tracker is a fan-made, open-source clothing inventory web app built with **zero dependencies** — pure vanilla JavaScript, CSS, and HTML. No frameworks, no bundlers, no build tools beyond simple copy scripts. It uses Supabase for auth, cloud sync, and photo storage. It runs as a web app (desktop and mobile versions) and as a native desktop app via Tauri v2.


The user (Aaron) is the sole developer and is **not a professional programmer**. All explanations must be ELI5. Always explain what you plan to do and why before making changes. Ask permission before proceeding with anything non-trivial.


---


## Project Location and Repository


- **Project root:** `/Users/ad21/Documents/shirt-tracker/`
- **Repository:** `https://github.com/aaronmdunn/shirt-tracker` (branch: `main`)
- **Current version:** `2.0.3` (constant `APP_VERSION` in app.js, line 31)
- **License:** GPL-3.0


---


## Architecture Overview


This is a monorepo-style project with three front-end targets that share NO code — each has its own independent `app.js`, `style.css`, and `index.html`:


```
apps/
  web-desktop/src/     ← Desktop web version (primary development target)
    app.js             (~6,821 lines, single file)
    style.css          (~2,260 lines)
    index.html
    assets/            (icons, logo image: shirt-tracker.png)
    fonts/
  web-mobile/src/      ← Mobile web version (parallel copy of desktop)
    app.js             (~6,779 lines)
    style.css          (~2,429 lines)
    index.html
    assets/
    fonts/
  desktop-tauri/       ← Tauri v2 native desktop wrapper
    src/index.html     (synced copy of web-desktop build)
    src-tauri/         (Rust/Tauri config)
  web-root/            ← Netlify deploy output (auto-generated)
    d/                 (desktop build)
    m/                 (mobile build)
```


**CRITICAL:** Changes must go to BOTH `web-desktop` and `web-mobile` source files unless the user specifies otherwise. The mobile version is a parallel copy with the same logic but slightly different CSS/layout.


---


## Build and Deploy


| Command | What It Does |
|---------|-------------|
| `npm run build:web-root` | Copies desktop src → `web-root/d/` and mobile src → `web-root/m/` as single-file HTML builds |
| `npm run sync:tauri` | Syncs desktop build → `desktop-tauri/src/index.html`, stamps deploy date |


**Always run both commands after any source edit.** The build outputs are committed to the repo.


There are NO transpilers, bundlers, or minifiers. The `app.js` files are served as-is. Build scripts (`scripts/build-web-root.mjs`, `scripts/sync-tauri-html.mjs`) simply inline/copy files.


---


## Backend


- **Supabase** (hosted): Auth, cloud sync (`shirt_state` table), photo storage (`shirt-photos` bucket)
  - URL: `https://jbmzsxbzqvgsasjhwuko.supabase.co`
  - Anon key: `sb_publishable_Tv2JI_3n8Q9eaC05c4P40Q_vfZvLWZa`
- **Netlify Functions** (`netlify/functions/backup.mjs`): Backup endpoint
- **Google Analytics:** `G-T80L2765XZ`


---


## Storage Architecture


All state is persisted to `localStorage` with versioned keys. Photos use IndexedDB (`shirt-tracker-photos` database, `photos` store). Cloud sync goes through Supabase.


### Storage Keys


| Key Pattern | Purpose |
|-------------|---------|
| `shirts-db-v3:{tabId}` | Inventory tab row/column data |
| `shirts-tabs-v1` | Inventory tabs list and active tab ID |
| `shirts-columns-v2` | Inventory column overrides (fandom/type/brand options per tab, hidden columns, globalColumns) |
| `wishlist-db-v1:{tabId}` | Wishlist tab row/column data |
| `wishlist-tabs-v1` | Wishlist tabs list and active tab ID |
| `wishlist-columns-v1` | Wishlist column overrides |
| `shirts-app-mode` | Current mode: `"inventory"` or `"wishlist"` |
| `shirts-event-log-v1` | Event log entries (max 200) |
| `shirts-last-sync` | Timestamp of last cloud sync |
| `shirts-last-cloud-update` | Timestamp of last cloud update |
| `shirts-last-change` | Timestamp of last local change |
| `shirts-last-activity` | Timestamp of last user activity |
| `shirts-app-version` | Stored app version for migration detection |
| `shirts-app-update-date` | App update date display |
| `shirts-signed-out-greeting` | Greeting shown when signed out |
| `shirts-current-user` | Stored user ID for detecting account switches |
| `shirts-signed-url-cache` | Cache for Supabase signed photo URLs (TTL: 50 min) |
| `shirt-update-date` | User's "Shirt Last Updated" timestamp |


---


## Two-Mode Architecture: Inventory vs. Wishlist


The app has two modes — **Inventory** and **Wishlist** — toggled by a segmented button rendered by `renderModeSwitcher()`. In desktop/Tauri, this button is placed inside `.sheet-header` (left-aligned, opposite the action buttons). In mobile, it has its own centered row. Each mode has completely separate storage (different localStorage key prefixes) but shares the same runtime `state`, `tabsState`, `columnOverrides`, and `globalColumns` objects.


### How Mode Switching Works (swap pattern)


When switching modes:
1. Current mode's state is saved to localStorage via `saveState()`
2. Current mode's metadata is captured via `snapshotCurrentMode()` into `savedModeState[currentMode]`
3. `appMode` is updated and persisted to `APP_MODE_KEY`
4. If a snapshot exists for the new mode, it's restored via `restoreModeSnapshot()`; otherwise fresh state is loaded from localStorage (or initialized fresh for wishlist via `initWishlistMode()`)
5. `loadState()` reads row/column data from localStorage using mode-aware storage keys
6. Mode-specific enforcement runs (`enforceWishlistColumns()` or `enforceFixedDropdownDefaults()`)
7. Full re-render: `renderTable()`, `renderTabs()`, `renderModeSwitcher()`, `renderFooter()`


### Inventory Default Columns
`getDefaultColumns()` (line 351): Shirt Name (text), Condition (select: NWT/NWOT/EUC/Other), Price (number), Size (select: XS through 5X), Type (select), Fandom (select), Preview (photo), Notes (notes)


### Wishlist Default Columns
`getWishlistDefaultColumns()` (line 362): Brand (select), Shirt Name (text), Type (select), Fandom (select), Size (select: XS through 5X), Preview (photo), Notes (notes)


### Key Differences in Wishlist Mode
- **Brand column exists** (position 0) — removed from inventory by `removeBrandColumn()`
- **Condition and Price columns are stripped** by `enforceWishlistColumns()`
- **"Got It!" button** appears on each row (replaces Tags + For Sale buttons) — transfers row to inventory via `moveRowToInventory()`
- **Tags button, For Sale button, and "Tag Items" bulk action are hidden**
- **Tab logo panel is hidden** (via `updateTabLogo()`)
- **Add, Edit, Delete tab buttons are shown** (guard removed in `renderTabs()` — wishlist supports multiple tabs)
- **Mode switcher only shows when signed in** (`currentUser` check in `renderModeSwitcher()`)


---


## For Sale Feature


The app has a "For Sale" system that lets users mark inventory items as for sale. It piggybacks on the existing Tags infrastructure.


### How It Works
- A `FOR_SALE_TAG` constant (`"For Sale"`) is defined at line 44
- `isForSale(row)` (line 4857) checks if the row has the "For Sale" tag
- `toggleForSale(rowId)` (line 4859) adds or removes the tag via `setRowTags()`
- In the **Actions column** (inventory mode only), a "For Sale" toggle button appears below the Tags button. When active, it highlights green.
- In the **Shirt Name cell**, a green "FOR SALE" badge renders below the input inside a wrapper `<div>`. The input's bottom border and border-radius are removed so the badge connects flush. This badge renders regardless of `state.readOnly`, so **it's visible in the shared/public view**.
- In the **filter dropdown**, "For Sale" appears as a filter option with Yes/No selection (inventory mode only, gated by `allowTagsFilter`)


### Key Code Locations (Desktop)
| What | Line |
|------|------|
| `FOR_SALE_TAG` constant | 44 |
| `isForSale()` helper | 4857 |
| `toggleForSale()` function | 4859 |
| "For Sale" badge in Shirt Name cell | 5215 |
| "For Sale" toggle button in Actions | 5274 |
| "For Sale" filter option in dropdown | 4293 |
| "For Sale" branch in `updateFilterInputMode()` | 4311 |
| "For Sale" branch in `getFilteredRows()` | 5165 |


---


## Column Sorting


Clicking any column header sorts the table by that column. The sort state is stored in `state.sort` (`{ columnId, direction }`) and is already serialized/persisted.


### How It Works
- `sortRows()` (line 4578) reads `state.sort.columnId` and `state.sort.direction`. If `columnId` is null, falls back to sorting by Shirt Name ascending.
- Number columns sort numerically; all others sort alphabetically via `localeCompare`.
- Empty values are always pushed to the bottom regardless of direction.
- The direction multiplier (`dir`) is `1` for asc and `-1` for desc.
- Click handlers on `<th>` elements (added in `renderHeader()`, line 4530) toggle the sort. Clicking the same column flips direction; clicking a new column sets it to asc.
- A red arrow indicator (▲/▼) is rendered next to the active sort column's label (line 4524).
- The resizer `<span class="col-resizer">` uses `stopPropagation()` on mousedown, so click-to-sort doesn't conflict with drag-to-resize.


---


## Price Stats in Footer


`renderFooter()` (line 5316) calculates and displays price statistics in the `#total-cost` element:
- **Desktop:** Shows `Total: $X | Avg: $X` inline with pipe separators
- **Mobile:** Shows Total and Avg stacked vertically (`flex-direction: column`)
- Stats are calculated from all filtered rows that have a parseable price value
- Hidden when the Price column is hidden or doesn't exist


---


## Key Functions Reference (Desktop app.js Line Numbers)


### Core State
| Function | Line | Purpose |
|----------|------|---------|
| `createId()` | 89 | Generates unique IDs |
| `defaultRow()` | 96 | Creates empty row with ID and empty cells |
| `serializeState()` | 1088 | Serializes state for localStorage |
| `saveState()` | 1097 | Saves state to localStorage, schedules cloud sync |
| `loadState()` | 2722 | Loads state from localStorage (mode-aware via `getStorageKey()`) |


### Storage Key Routing (Mode-Aware)
| Function | Line | Purpose |
|----------|------|---------|
| `getStorageKey(tabId)` | 631 | Returns `shirts-db-v3:{tabId}` or `wishlist-db-v1:{tabId}` based on `appMode` |
| `getActiveTabKey()` | 636 | Returns tab storage key for current mode |
| `getActiveColumnsKey()` | 637 | Returns columns storage key for current mode |


### Tabs and Column Overrides
| Function | Line | Purpose |
|----------|------|---------|
| `saveTabsState()` | 845 | Saves tabs to mode-aware key |
| `loadTabsState()` | 1030 | Loads tabs from mode-aware key |
| `loadColumnOverrides()` | 854 | Loads fandom/type/brand options, hidden columns, globalColumns from localStorage |
| `saveColumnOverrides()` | 882 | Saves column overrides including `brandOptionsByTab` |
| `setGlobalColumns(columns)` | 909 | Creates globalColumns with stripped options for fandom/type/brand |
| `applyGlobalColumns()` | 922 | Replaces `state.columns` with shallow copies of `globalColumns` |
| `remapRowsToGlobalColumns(prev)` | 927 | Remaps row cell IDs when columns change |


### localStorage Account Isolation
| Function | Line | Purpose |
|----------|------|---------|
| `clearAppLocalStorage()` | 1414 | Removes all app keys except Supabase session keys (`sb-*`), app version, update date, and current user key |
| `handleUserSwitch(userId)` | 1426 | Compares new user ID against stored one; if different, clears localStorage and resets all in-memory state |


### Column Enforcement
| Function | Line | Purpose |
|----------|------|---------|
| `enforceFixedDropdownDefaults()` | 2356 | Ensures Condition/Size have correct fixed options (inventory only) |
| `enforceWishlistColumns()` | 3325 | Strips Condition/Price, ensures Brand at position 0 (wishlist only) |
| `enforceWishlistDropdownDefaults()` | 3374 | Ensures Size has correct fixed options in wishlist |
| `removeBrandColumn()` | 3012 | Strips Brand column from inventory (guarded by `appMode === "inventory"`) |


### Per-Tab Dropdown Options
| Function | Line | Purpose |
|----------|------|---------|
| `applyTabFandomOptions()` | 2985 | Restores Fandom dropdown options for active tab |
| `applyTabTypeOptions()` | 2994 | Restores Type dropdown options for active tab |
| `applyTabBrandOptions()` | 3003 | Restores Brand dropdown options for active tab |


### Mode Switching
| Function | Line | Purpose |
|----------|------|---------|
| `snapshotCurrentMode()` | 3135 | Deep-copies tabsState, columnOverrides, globalColumns |
| `restoreModeSnapshot(snapshot)` | 3142 | Restores tabs, columnOverrides (including brandOptionsByTab), globalColumns |
| `initWishlistMode()` | 3152 | First-time wishlist initialization from localStorage (clears `tabsState.tabs` first to prevent inventory tab leakage) |
| `switchAppMode(nextMode)` | 3201 | Full mode switch orchestration |
| `renderModeSwitcher()` | 3275 | Renders Inventory/Wishlist toggle; desktop: prepends into `.sheet-header`; mobile: centered row |


### Wishlist Transfer
| Function | Line | Purpose |
|----------|------|---------|
| `moveRowToInventory(rowId)` | 3395 | "Got It!" handler — shows tab picker dialog, maps cell values by column name, writes to inventory localStorage, invalidates inventory snapshot, auto-adds new Type/Fandom/Brand options |


### For Sale
| Function | Line | Purpose |
|----------|------|---------|
| `isForSale(row)` | 4857 | Checks if row has the "For Sale" tag |
| `toggleForSale(rowId)` | 4859 | Adds or removes the "For Sale" tag |


### Rendering
| Function | Line | Purpose |
|----------|------|---------|
| `renderTabs()` | 3523 | Renders tab bar with Add/Edit/Delete buttons (both modes) |
| `switchTab(tabId)` | 3584 | Switches active tab, reloads state |
| `renderFooter()` | 5316 | Renders row count, total cost, and average price |
| `renderTable()` | 5362 | Full table re-render |
| `renderHeader()` | 4499 | Renders column headers with sort indicators and click-to-sort handlers |
| `renderRows()` | 5178 | Renders all filtered data rows |
| `updateHeaderTitle()` | 2165 | Updates `#app-title` element |
| `updateHeaderSubtitle()` | 2254 | Updates `#app-subtitle` element |
| `updateTabLogo()` | 2103 | Renders/hides tab logo panel (hidden in wishlist) |
| `updateDeleteSelectedState()` | 3871 | Manages bulk action buttons (hides bulk tags in wishlist) |
| `sortFilterOptionsForLabel()` | 4972 | Alphabetically sorts dropdown options (excludes Condition/Size to preserve defined order) |
| `prefetchPhotoSources()` | 277 | Preloads signed photo URLs |


### Sorting
| Function | Line | Purpose |
|----------|------|---------|
| `sortRows()` | 4578 | Sorts rows by `state.sort` column/direction, falls back to Shirt Name asc |
| `sortAndRenderPreserveFocus()` | 3792 | Sorts, re-renders, and restores cursor focus position |
| `scheduleNameSort()` | 3813 | Debounced sort trigger (250ms) called when editing Shirt Name |
| `flushInputsToState()` | 3743 | Reads all DOM inputs back into state before sort/render |


### Filtering
| Function | Line | Purpose |
|----------|------|---------|
| `renderFilterOptions()` | 4258 | Builds filter column dropdown (includes Tags and For Sale options) |
| `updateFilterInputMode()` | 4309 | Switches between text input and dropdown based on selected filter column |
| `getFilteredRows()` | 5157 | Filters rows by column, tags, or for-sale status |


### Cloud Sync
| Function | Line | Purpose |
|----------|------|---------|
| `buildCloudPayload()` | 2289 | Builds full cloud payload including both inventory and wishlist data |
| `applyCloudPayload(payload)` | 2378 | Applies cloud data to local state (handles brandOptionsByTab in all 4 paths); calls `applyTabFandomOptions()`, `applyTabTypeOptions()`, `applyTabBrandOptions()` after `loadState()` |
| `loadRemoteState()` | 2558 | Async cloud state loader; called from `getSession().then()` and `onAuthStateChange(INITIAL_SESSION)` |
| `scheduleSync()` | 2526 | Debounced cloud sync (1.2s delay) |
| `syncToSupabase()` | 2532 | Executes cloud sync |


### Tags
| Function | Line | Purpose |
|----------|------|---------|
| `getRowTags(row)` | 4852 | Safely extracts non-empty tags from a row |
| `setRowTags(rowId, nextTags, logContext)` | 5038 | Sets tags on a row, saves, syncs, re-renders, logs changes |
| `matchesTagFilter(row, queryLower)` | 4870 | Returns true if any tag contains the query (case-insensitive) |


### Currency
| Function | Line | Purpose |
|----------|------|---------|
| `formatCurrency(value)` | 5569 | Formats number as USD string |
| `parseCurrency(value)` | 5580 | Parses currency string to number |


### Table Operations
| Function | Line | Purpose |
|----------|------|---------|
| `pruneRowCells()` | 2969 | Removes cell data for non-existent columns |
| `ensureRowCells()` | 2949 | Ensures every row has a cell entry for every column |
| `attachResizer()` | 4464 | Adds drag-to-resize handle on column headers |


### UI Sections
| Section | Line | Notes |
|---------|------|-------|
| Select cell rendering (dropdowns) | 4615 | Where `column.type === "select"` cells are built with "Add new..." option |
| "For Sale" badge in Shirt Name cell | 5215 | `if (isShirtNameColumn(column) && isForSale(row))` block |
| "For Sale" toggle button | 5274 | Inside `if (appMode !== "wishlist")` block in row actions |
| "Got It!" button rendering | 5294 | `if (appMode === "wishlist")` block in row actions |
| Tags button conditional | 5271 | Only appended when `appMode !== "wishlist"` |
| Tags filter conditional | 4268 | `allowTagsFilter` excludes wishlist mode and public share |
| Sort arrow indicator | 4524 | `if (state.sort.columnId === column.id)` in `renderHeader()` |
| Auth block (getSession/onAuthStateChange) | 5638 | `if (supabase) {` block |
| `onAuthStateChange` handler | 5679 | Skips `TOKEN_REFRESHED` events to prevent flicker |
| Startup / initialization | 6738 | Mode loading, `renderModeSwitcher()`, first `loadState()`, etc. |


---


## Critical Rules and Constraints


1. **No CSS changes unless explicitly authorized.** Use JavaScript inline styles if styling changes are needed.
2. **No new dependencies or build tools.** The project is intentionally zero-dependency vanilla JS.
3. **Build outputs must remain single-file HTML** (inlined CSS + JS).
4. **No unsanitized `innerHTML`** — XSS risk. Use `textContent` or DOM creation methods.
5. **Never revert unrelated changes** when making edits.
6. **No commits unless explicitly asked.** When committing, use format: Title line + detailed summary paragraph (no bullet points).
7. **Always run `npm run build:web-root` and `npm run sync:tauri`** after source edits.
8. **Changes go to BOTH desktop and mobile** source files unless specified otherwise.
9. **`showToast()` does not exist** in the codebase — don't call it.
10. **`sortFilterOptionsForLabel()` alphabetically sorts dropdown options** — Condition and Size must be excluded from sorting to preserve their defined order.


---


## Important Discoveries and Gotchas


1. **JavaScript overwrites HTML content at runtime:** Both `updateHeaderTitle()` and `updateHeaderSubtitle()` overwrite `#app-title` and `#app-subtitle`. HTML-only changes to these elements will be lost.


2. **Cloud sync overwrites local state:** When `applyCloudPayload()` runs after sign-in, it restores columns from the cloud. Any backfill/enforcement code must run in multiple places: (1) initial startup, (2) inside `applyCloudPayload()`, (3) inside `switchTab()`, and (4) inside `switchAppMode()`.


3. **Hidden elements with empty text can still render as dots** if they have padding/margin/background. Use `display: none` instead of just clearing `textContent`.


4. **`removeBrandColumn()` actively strips Brand from state.** It must be guarded with `appMode === "inventory"` to prevent stripping Brand from wishlist.


5. **The wishlist "swap" pattern:** `tabsState`, `columnOverrides`, `globalColumns`, and `state` are the SINGLE active objects. When switching modes, the outgoing state is snapshotted and the incoming state is restored or loaded fresh. This means any function that modifies these objects affects whichever mode is currently active.


6. **First-time wishlist switch:** `state.columns` must be explicitly cleared before `loadState()` when there's no snapshot, otherwise leftover inventory columns persist into the wishlist.


7. **Snapshot invalidation:** When `moveRowToInventory()` writes to inventory localStorage, it must `delete savedModeState["inventory"]` so the next mode switch reads fresh data instead of a stale snapshot.


8. **Column overrides must include `brandOptionsByTab`** in: `saveColumnOverrides()`, `loadColumnOverrides()`, `restoreModeSnapshot()`, and all 4 code paths in `applyCloudPayload()`. This was a bug that was fixed in commit `2933d52`.


8b. **`initWishlistMode()` must also load `brandOptionsByTab`** from `WISHLIST_COLUMNS_KEY`. It was loading fandom, type, and hidden column overrides but skipping brand. Fixed in `5e466e1`.


8c. **`applyCloudPayload()` must call per-tab option restorers** (`applyTabFandomOptions()`, `applyTabTypeOptions()`, `applyTabBrandOptions()`) after `loadState()`. Without these, async cloud sync completing with stale data would overwrite `columnOverrides` and lose per-tab dropdown options. Fixed in `1115614`.


8d. **`applyGlobalColumns()` must NOT be called inside `applyCloudPayload()`** — Adding it caused one account's column structure to overwrite another's because `globalColumns` had already been set from the cloud payload. This caused cross-account data contamination. Reverted in `a131653`.


9. **The `.sheet` CSS class** has `background: var(--paper)`, `border-radius: 20px`, `border: 1px solid var(--line)`, `overflow: hidden`. The `#mode-switcher` element is hidden (`display: none`) in desktop; the toggle is injected into `.sheet-header` instead. The `.tab-bar` has its own grey gradient background (`linear-gradient(90deg, #eeeeee, #e1e1e1)`).


10. **Mobile `renderTabs()` uses a `tab-controls` wrapper div** around Add/Edit/Delete buttons, while desktop appends them directly to `tabBar`. The wishlist guard structure differs slightly between the two.


11. **localStorage is shared per origin, not per user.** When two accounts sign in on the same browser/URL, they share the same localStorage. Without clearing on user switch, one account's cached data bleeds into another. Fixed by adding `handleUserSwitch()` in `5b9e0d6`.


12. **`loadRemoteState()` is called TWICE on page load** — once from `getSession().then()` and once from `onAuthStateChange(INITIAL_SESSION)`. Both are async and can arrive after the user has already interacted with the UI. The `handleUserSwitch()` function is called in both paths before `loadRemoteState()` to ensure account isolation.


13. **`initWishlistMode()` must clear `tabsState.tabs` before loading** — When no wishlist data existed in localStorage, it checked `if (!tabsState.tabs.length)` to decide whether to create a default tab, but `tabsState.tabs` still held inventory tabs from the previous mode. This caused all inventory brand tabs to leak into wishlist mode. Fixed by adding `tabsState.tabs = []; tabsState.activeTabId = null;` at the start of the function in `012f6ae`.


14. **The filter row layout on desktop uses CSS grid** — `.filter-row` has `display: grid; grid-template-columns: auto 1fr;` with `.top-table-actions` on the left and `.filter-center` on the right. The mode switcher no longer overrides this layout (it was moved to `.sheet-header` in `5d1f024`).


15. **`onAuthStateChange` fires `TOKEN_REFRESHED` on tab return** — Supabase automatically refreshes the auth token when the browser tab regains focus. The handler now returns early for `TOKEN_REFRESHED` events to prevent unnecessary UI flicker. Fixed in `6f2b4ba`.


16. **Setting `td.style.display = "flex"` on table cells breaks table layout** — When adding the "For Sale" badge, using flex on the `<td>` caused rendering artifacts (white boxes on other rows). The fix is to use a wrapper `<div>` inside the `<td>` instead.


17. **The column resizer uses `stopPropagation()` on mousedown** — This means click handlers added to `<th>` elements for sorting don't conflict with drag-to-resize. The resizer is a child `<span class="col-resizer">` appended by `attachResizer()`.


18. **`state.sort` was scaffolding waiting to be used** — The `state.sort` object (`{ columnId, direction }`) was defined, serialized, persisted, and cleaned up on column deletion since early versions, but `sortRows()` was hardcoded to sort by Shirt Name ascending. It was wired up in `6f2b4ba`.


---


## Commit History (Recent, Newest First)


```
6b76ecf Add release notes for v2.0.3
6f2b4ba Add For Sale filter, column sorting, price stats, and fix token refresh flicker
7afd793 Add For Sale toggle with visible badge in shared view
5d1f024 Move mode switcher to sheet header, bump to v2.0.3, and remove steve.png
5b9e0d6 Clear localStorage when switching between user accounts
a131653 Fix account data bleeding across users after cloud sync
1115614 Fix brand dropdown options lost after cloud sync
5e466e1 Hide Tags from wishlist filter and persist wishlist Brand options
012f6ae Fix wishlist tabs and center filter layout
74f57bf Hide Add, Edit, and Delete tab buttons in wishlist mode
2933d52 Persist Brand dropdown options across mode switches and cloud sync
a8fe70a Fix transferred wishlist items not appearing in inventory without refresh
1d3d681 Fix mode switcher background mismatch
38a862a Improve wishlist Got It flow and hide inventory-only UI in wishlist mode
efde5bf Add wishlist mode with segmented switcher and separate storage
0b3f958 Move Column Definitions in help dialog and fix input heights
10add58 Add UI polish and input improvements across desktop and mobile
be01bef Fix mobile logo centering
2466dd9 Add GitHub repo link, restyle legal title, and remove Mickey logo
61789cf Replace README with minimal public-facing version
b581784 Remove continuation prompt
b04ca17 Add GPL-3.0 license and rename Last Deployment label
008e494 Replace header title text with logo image and update subtitle
c6760c3 Update continuation prompt to reflect v2.0.2 release
3bfa805 Bump to v2.0.2 with release notes and continuation prompt
```


---


## What Was Accomplished in the Most Recent Session


1. **Move mode switcher to sheet header** (`5d1f024`) — Relocated the Inventory/Wishlist segmented toggle from its own full-width centered row into the `.sheet-header` bar (desktop and Tauri only), where it sits left-aligned opposite the action buttons. Reduced padding, font size, and border radius. Removed the flex-column override on `.filter-row` so it returns to its default CSS grid layout. Added `flexShrink: "0"` on the container so it doesn't get squished.


2. **Version bump to 2.0.3** (`5d1f024`) — Bumped across all 7 locations using the `bump-version.mjs` script.


3. **Removed steve.png** (`5d1f024`) — Deleted the unused image from all 6 locations and removed the copy logic from `scripts/sync-tauri-html.mjs`.


4. **Add For Sale toggle with visible badge** (`7afd793`) — Added `FOR_SALE_TAG` constant, `isForSale()` helper, and `toggleForSale()` function. Added a "For Sale" toggle button in the Actions column (inventory mode only) that highlights green when active. Added a green "FOR SALE" badge below the Shirt Name input using a wrapper `<div>` (visible in shared view). The badge connects flush to the input by removing the input's bottom border and border-radius.


5. **Add For Sale filter** (`6f2b4ba`) — Added "For Sale" as an option in the filter column dropdown with Yes/No selection. Added branches in `updateFilterInputMode()` and `getFilteredRows()`.


6. **Column sorting** (`6f2b4ba`) — Modified `sortRows()` to read `state.sort.columnId` and `state.sort.direction` instead of being hardcoded to Shirt Name. Added click handlers on `<th>` elements in `renderHeader()` to toggle sort column and direction. Added red arrow indicators (▲/▼) next to the active sort column label. Number columns sort numerically, others alphabetically.


7. **Price stats** (`6f2b4ba`) — Expanded `renderFooter()` to show Total and Average price. Desktop uses inline pipe separators; mobile stacks vertically.


8. **Fix token refresh flicker** (`6f2b4ba`) — Added early return for `TOKEN_REFRESHED` events in the `onAuthStateChange` handler to prevent unnecessary full auth reload and re-render cycle when switching browser tabs.


9. **Release notes for v2.0.3** (`6b76ecf`) — Created `release-notes/2.0.3.md` documenting all changes since v2.0.2.


---


## Revert Points


- **`7afd793`** — Before: For Sale filter, column sorting, price stats, token flicker fix. After: For Sale toggle + badge only.
- **`5d1f024`** — Before: entire For Sale feature. After: mode switcher move, version bump, steve.png removal only.


---


## Other Project Files


| File/Directory | Purpose |
|---|---|
| `LICENSE` | GPL-3.0 full text |
| `README.md` | Minimal 3-line public README |
| `netlify.toml` | Netlify config (functions directory) |
| `netlify/functions/backup.mjs` | Backup Netlify function |
| `supabase/` | Supabase config and edge functions (`notify-admin`) |
| `scripts/build-web-root.mjs` | Builds web-root deploy output |
| `scripts/sync-tauri-html.mjs` | Syncs desktop build to Tauri, stamps deploy date |
| `scripts/bump-version.mjs` | Version bumping utility (targets 5 source files, 7 locations) |
| `scripts/stamp-deploy-date.mjs` | Deploy date stamping |
| `scripts/build-tauri.sh` | Tauri build script |
| `release-notes/` | Version release notes (1.936.0, 1.939.002, 1.939.2, 1.939.3, 2.0.2, 2.0.3) |
| `.gitignore` | Standard ignores + `REFACTOR-PROMPT.md`, `.netlify`, `*.app`, `deno.lock` |
