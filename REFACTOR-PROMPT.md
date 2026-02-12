# Refactor Prompt: Split Single-File SPA into Separate Files

Paste everything below this line into a new Claude Code session when you're ready to do this.

---

## Context

I have a project called Shirt Tracker. It's a fan-made clothing inventory app with desktop web, mobile web, and Tauri desktop versions. The entire app for each platform is a single `index.html` file containing ALL the HTML, CSS, and JavaScript inline — we're talking 8,000-9,000+ lines per file.

I want to split each platform's single `index.html` into three separate source files:
- `index.html` — just the HTML markup, with `<link>` and `<script>` tags pointing to the other two files
- `style.css` — all the CSS (everything currently inside the `<style>` tag)
- `app.js` — all the JavaScript (everything currently inside the `<script>` tag)

**IMPORTANT: I am not a developer.** I don't know how build tools, module systems, or bundlers work. I need you to ELI5 every step, explain what you're about to do before you do it, and hold my hand through the entire process. If there's a decision to make, explain the options in plain English and ask me. Don't assume I know what any technical term means.

## Repository

- **Repo root:** `/Users/ad21/Documents/shirt-tracker/`
- **Remote:** `https://github.com/aaronmdunn/shirt-tracker` (origin, branch: main)

## Project Structure

```
apps/
  web-desktop/src/index.html     — Desktop web source (PRIMARY)
  web-mobile/src/index.html      — Mobile web source (separate but similar)
  web-root/d/index.html          — Built desktop web for Netlify (auto-generated, MUST stay single-file)
  web-root/m/index.html          — Built mobile web for Netlify (auto-generated, MUST stay single-file)
  desktop-tauri/src/index.html   — Tauri source (auto-synced from desktop web, MUST stay single-file)
  desktop-tauri/src-tauri/tauri.conf.json
scripts/
  build-web-root.mjs             — Copies/builds desktop+mobile into web-root for Netlify
  sync-tauri-html.mjs            — Syncs desktop web → Tauri, copies assets/fonts
```

## Critical Requirements

1. **The deployed/built output MUST remain single-file.** Netlify serves `web-root/d/index.html` and `web-root/m/index.html` as self-contained single files. Tauri loads `desktop-tauri/src/index.html` as a single file. The build scripts need to be updated to **inline** the separate CSS and JS files back into the HTML during the build step.

2. **Both platforms need splitting.** Desktop web (`web-desktop/src/`) and mobile web (`web-mobile/src/`) each get their own `style.css` and `app.js`.

3. **The build commands must still work the same way:**
   - `npm run build:web-root` — must produce identical single-file output in `web-root/`
   - `npm run sync:tauri` — must produce identical single-file output in `desktop-tauri/src/`

4. **No new dependencies or build tools.** Don't add webpack, vite, rollup, or any bundler. The build scripts are plain Node.js (`scripts/*.mjs`) and should stay that way. Just update them to read the three source files and inline them into one HTML file.

5. **The app must work identically after refactoring.** Same features, same behavior, same appearance. This is purely a file organization change.

6. **Do NOT commit unless I explicitly ask.** Show me the plan first, do the work, let me verify, then I'll tell you to commit.

## Workflow

Follow this workflow for the entire refactor:

1. **ELI5 the full plan** before touching any files. Explain what will change, what won't change, and why. Use analogies if helpful.
2. **Show me the risk score** (1-10) and rollback instructions.
3. **Ask for my permission** and wait for "Yes" before proceeding.
4. **Do the work in phases:**
   - Phase 1: Split desktop web source into 3 files
   - Phase 2: Update `build-web-root.mjs` to inline CSS/JS back into single-file output
   - Phase 3: Run `npm run build:web-root` and verify the output matches
   - Phase 4: Update `sync-tauri-html.mjs` to produce single-file Tauri output
   - Phase 5: Run `npm run sync:tauri` and verify
   - Phase 6: Split mobile web source into 3 files
   - Phase 7: Run full build again and verify both platforms
5. **After each phase**, tell me what you did and confirm it worked before moving on.
6. **At the end**, show me the final file structure so I can see what changed.

## What Success Looks Like

- Source files are split: I can open `style.css` or `app.js` separately to edit them
- Built output is identical: the deployed single-file HTML hasn't changed in behavior
- All three build commands still work
- Git diff is clean and reviewable
- I understand what happened
