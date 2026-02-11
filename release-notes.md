# Release Notes — 1.939.002

## Icon System

- Removed the six-tab brand whitelist so type icons now display on all tabs
- Added "Upload custom..." option to the icon picker dialog with file upload (200KB limit), data URL storage, and 48x48 preview
- Fixed icon prompt not appearing when a new Type is added via the "Add new..." dropdown option
- Fixed icon not populating in the row when an existing Type with a known icon mapping is selected
- Icon cell now updates live in the DOM without a full table re-render
- Fixed case sensitivity bug where raw-cased type values failed to match lowercase keys in TYPE_ICON_DEFAULTS
- Fixed pant.jpg reference to pant.png in ICON_CHOICES

## Data Management

- Added Export CSV button to the Cloud Backup section, generating RFC-compliant CSV with all columns including Price and Tags (excludes photo/preview)
- Added Import CSV button that parses uploaded CSV files, matches headers case-insensitively, appends rows, auto-adds new select option values, and imports tags

## Event Log

- Added real-time search/filter input to the event log dialog
- Destructive actions (delete row, delete rows, clear all) now store a snapshot of the affected row data
- Event log entries for destructive actions are expandable to show full column-by-column details of deleted rows
- Removed "Switched tab" entries from event logging

## UI / UX

- Renamed header subtitle from "Shirt Inventory" to "Inventory"
- Added left-to-right gradient (#c0c0c0 to #efefef) on the signed-out sheet background
- Made sheet header and footer backgrounds transparent when signed out so the gradient shows through
- Hidden the filter row when signed out for a cleaner login view
- Fixed photo dialog sizing in WebKit (Safari/Tauri) with min-height: 60vh and object-fit: contain

## Dropdowns

- Added inline "Add new..." option to all select-type dropdowns (Condition, Size, Type, Fandom, Brand, etc.) that prompts the user for a new value, prevents duplicates, and respects per-tab overrides for Fandom and Type columns
- Only shown when not in read-only mode

## Dialog Styling

- Changed Legal Disclaimer dialog from about-dialog to privacy-dialog class for left-aligned text
- Changed Credits & Acknowledgements dialog to privacy-dialog class with centered body text override
- Added missing privacy-dialog CSS rules to mobile source

## Bug Fixes

- Fixed dropdown reset bug where selecting "Add new..." wrote the literal "__add_new__" sentinel value to row state, caused by two root issues: handleCellEvent not guarding the sentinel, and renderRows destroying/rebuilding the DOM without first flushing current input values via flushInputsToState
- Added flushInputsToState call at the top of renderRows to preserve in-progress edits during re-renders
