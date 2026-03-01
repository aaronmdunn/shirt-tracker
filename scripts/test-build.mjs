/**
 * Smoke tests for the Shirt Tracker build pipeline.
 *
 * Runs after `build-web-root.mjs` and `sync-tauri-html.mjs` to verify:
 *   1. All expected output files exist
 *   2. CSS and JS are properly inlined into each index.html
 *   3. Service worker files exist with correct version
 *   4. No $& / $' pattern corruption in minified output
 *   5. CHANGELOG.json is valid and matches the current version
 *   6. Version strings are consistent across all source files
 *   7. _redirects file is generated correctly
 *   8. Shared CSS file exists with balanced platform markers
 *   9. Built CSS outputs contain no platform markers or cross-platform selectors
 *
 * Usage:  node scripts/test-build.mjs
 * Exit 0 on success, exit 1 on any failure.
 * No dependencies — uses only Node built-ins.
 */

import fs from "fs";
import path from "path";
import assert from "assert/strict";

const root = process.cwd();
let passed = 0;
let failed = 0;
const failures = [];

const test = (name, fn) => {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, message: err.message });
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message}`);
  }
};

const readFile = (relativePath) => {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf8");
};

const fileExists = (relativePath) =>
  fs.existsSync(path.join(root, relativePath));

// ─── Helper: extract version from various sources ───
const getPackageVersion = () => {
  const pkg = JSON.parse(readFile("package.json"));
  return pkg.version;
};

const getSharedAppJsVersion = () => {
  const content = readFile("apps/shared/app.shared.js");
  const match = content?.match(/const APP_VERSION = "([^"]+)";/);
  return match ? match[1] : null;
};

const getTauriVersion = () => {
  const content = readFile("apps/desktop-tauri/src-tauri/tauri.conf.json");
  if (!content) return null;
  return JSON.parse(content).version;
};

const getChangelogVersion = () => {
  const content = readFile("CHANGELOG.json");
  if (!content) return null;
  const entries = JSON.parse(content);
  return entries[0]?.version;
};

// ═══════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════

console.log("\n--- Build Output: File Existence ---\n");

test("web-root/d/index.html exists", () => {
  assert.ok(fileExists("apps/web-root/d/index.html"), "Missing desktop build output");
});

test("web-root/m/index.html exists", () => {
  assert.ok(fileExists("apps/web-root/m/index.html"), "Missing mobile build output");
});

test("web-root/d/sw.js exists", () => {
  assert.ok(fileExists("apps/web-root/d/sw.js"), "Missing desktop service worker");
});

test("web-root/m/sw.js exists", () => {
  assert.ok(fileExists("apps/web-root/m/sw.js"), "Missing mobile service worker");
});

test("web-root/_redirects exists", () => {
  assert.ok(fileExists("apps/web-root/_redirects"), "Missing _redirects file");
});

test("web-root/auth-redirect.html exists", () => {
  assert.ok(fileExists("apps/web-root/auth-redirect.html"), "Missing auth-redirect.html");
});

test("Tauri index.html exists", () => {
  assert.ok(fileExists("apps/desktop-tauri/src/index.html"), "Missing Tauri build output");
});

console.log("\n--- Build Output: Inlined Content ---\n");

test("Desktop index.html contains inlined <style>", () => {
  const html = readFile("apps/web-root/d/index.html");
  assert.ok(html, "Could not read desktop index.html");
  assert.ok(html.includes("<style>"), "No <style> block found — CSS not inlined");
});

test("Desktop index.html contains inlined <script>", () => {
  const html = readFile("apps/web-root/d/index.html");
  assert.ok(html, "Could not read desktop index.html");
  // The main app script should be inlined (not a src= reference to app.js)
  assert.ok(!html.includes('src="app.js"'), "app.js still referenced as external script — not inlined");
  // Count <script> tags — should have more than just the analytics/Supabase ones
  const scriptCount = (html.match(/<script>/g) || []).length;
  assert.ok(scriptCount >= 1, `Expected inlined <script> blocks, found ${scriptCount}`);
});

test("Mobile index.html contains inlined <style>", () => {
  const html = readFile("apps/web-root/m/index.html");
  assert.ok(html, "Could not read mobile index.html");
  assert.ok(html.includes("<style>"), "No <style> block found — CSS not inlined");
});

test("Mobile index.html contains inlined <script>", () => {
  const html = readFile("apps/web-root/m/index.html");
  assert.ok(html, "Could not read mobile index.html");
  assert.ok(!html.includes('src="app.js"'), "app.js still referenced as external script — not inlined");
});

test("Desktop: no leftover app.js file in build output", () => {
  assert.ok(!fileExists("apps/web-root/d/app.js"), "app.js should be deleted after inlining");
});

test("Desktop: no leftover style.css file in build output", () => {
  assert.ok(!fileExists("apps/web-root/d/style.css"), "style.css should be deleted after inlining");
});

test("Mobile: no leftover app.js file in build output", () => {
  assert.ok(!fileExists("apps/web-root/m/app.js"), "app.js should be deleted after inlining");
});

test("Mobile: no leftover style.css file in build output", () => {
  assert.ok(!fileExists("apps/web-root/m/style.css"), "style.css should be deleted after inlining");
});

test("Tauri index.html contains inlined <style>", () => {
  const html = readFile("apps/desktop-tauri/src/index.html");
  assert.ok(html, "Could not read Tauri index.html");
  assert.ok(html.includes("<style>"), "No <style> block found — CSS not inlined");
});

test("Tauri index.html contains inlined <script>", () => {
  const html = readFile("apps/desktop-tauri/src/index.html");
  assert.ok(html, "Could not read Tauri index.html");
  assert.ok(!html.includes('src="app.js"'), "app.js still referenced as external script — not inlined");
});

console.log("\n--- Service Worker: Version Injection ---\n");

test("Desktop sw.js contains versioned cache name (no placeholder)", () => {
  const sw = readFile("apps/web-root/d/sw.js");
  assert.ok(sw, "Could not read desktop sw.js");
  assert.ok(!sw.includes("__SW_VERSION__"), "Version placeholder was not replaced");
  assert.ok(sw.includes("shirt-tracker-v"), "Cache name prefix missing");
});

test("Mobile sw.js contains versioned cache name (no placeholder)", () => {
  const sw = readFile("apps/web-root/m/sw.js");
  assert.ok(sw, "Could not read mobile sw.js");
  assert.ok(!sw.includes("__SW_VERSION__"), "Version placeholder was not replaced");
  assert.ok(sw.includes("shirt-tracker-v"), "Cache name prefix missing");
});

console.log("\n--- Minification Integrity ---\n");

test("Desktop: no $& pattern corruption in inlined JS", () => {
  // After minification and inlining, the string literal "$&" should not appear
  // as a bare replacement artifact. It can appear inside string literals (like
  // regex replacements in the app code), but should never appear as a broken
  // variable name or statement.
  const html = readFile("apps/web-root/d/index.html");
  assert.ok(html, "Could not read desktop index.html");
  // Check for the specific corruption pattern: $& appearing at the start of a
  // line or after a semicolon (which indicates .replace() expansion)
  const corruptionPattern = /;\$&|^\$&/m;
  assert.ok(!corruptionPattern.test(html), "Possible $& pattern corruption detected in desktop build");
});

test("Mobile: no $& pattern corruption in inlined JS", () => {
  const html = readFile("apps/web-root/m/index.html");
  assert.ok(html, "Could not read mobile index.html");
  const corruptionPattern = /;\$&|^\$&/m;
  assert.ok(!corruptionPattern.test(html), "Possible $& pattern corruption detected in mobile build");
});

console.log("\n--- CHANGELOG.json Validation ---\n");

test("CHANGELOG.json is valid JSON", () => {
  const content = readFile("CHANGELOG.json");
  assert.ok(content, "Could not read CHANGELOG.json");
  const parsed = JSON.parse(content); // will throw if invalid
  assert.ok(Array.isArray(parsed), "CHANGELOG.json should be an array");
  assert.ok(parsed.length > 0, "CHANGELOG.json should not be empty");
});

test("CHANGELOG.json first entry has version, date, and changes", () => {
  const entries = JSON.parse(readFile("CHANGELOG.json"));
  const first = entries[0];
  assert.ok(first.version, "First entry missing 'version'");
  assert.ok(first.date, "First entry missing 'date'");
  assert.ok(Array.isArray(first.changes) && first.changes.length > 0, "First entry missing 'changes' array");
});

test("CHANGELOG.json first entry version matches package.json", () => {
  const changelogVersion = getChangelogVersion();
  const pkgVersion = getPackageVersion();
  assert.equal(changelogVersion, pkgVersion,
    `CHANGELOG first entry (${changelogVersion}) != package.json (${pkgVersion})`);
});

console.log("\n--- Version Consistency ---\n");

test("app.shared.js exists", () => {
  assert.ok(fileExists("apps/shared/app.shared.js"), "Missing shared app.js source");
});

test("app.shared.js contains PLATFORM placeholder", () => {
  const content = readFile("apps/shared/app.shared.js");
  assert.ok(content, "Could not read app.shared.js");
  assert.ok(content.includes('const PLATFORM = "__PLATFORM__"'),
    "Missing PLATFORM placeholder in app.shared.js");
});

test("style.shared.css exists", () => {
  assert.ok(fileExists("apps/shared/style.shared.css"), "Missing shared CSS source");
});

test("sw.js shared source exists", () => {
  assert.ok(fileExists("apps/shared/sw.js"), "Missing shared service worker source");
});

test("style.shared.css contains PLATFORM:desktop markers", () => {
  const content = readFile("apps/shared/style.shared.css");
  assert.ok(content, "Could not read style.shared.css");
  assert.ok(content.includes("/* PLATFORM:desktop */"),
    "Missing PLATFORM:desktop marker in style.shared.css");
  assert.ok(content.includes("/* /PLATFORM:desktop */"),
    "Missing /PLATFORM:desktop closing marker in style.shared.css");
});

test("style.shared.css contains PLATFORM:mobile markers", () => {
  const content = readFile("apps/shared/style.shared.css");
  assert.ok(content, "Could not read style.shared.css");
  assert.ok(content.includes("/* PLATFORM:mobile */"),
    "Missing PLATFORM:mobile marker in style.shared.css");
  assert.ok(content.includes("/* /PLATFORM:mobile */"),
    "Missing /PLATFORM:mobile closing marker in style.shared.css");
});

test("style.shared.css has balanced platform markers", () => {
  const content = readFile("apps/shared/style.shared.css");
  assert.ok(content, "Could not read style.shared.css");
  const dOpen = (content.match(/^\/\* PLATFORM:desktop \*\/$/gm) || []).length;
  const dClose = (content.match(/^\/\* \/PLATFORM:desktop \*\/$/gm) || []).length;
  assert.equal(dOpen, dClose,
    `Unbalanced desktop markers: ${dOpen} opens vs ${dClose} closes`);
  const mOpen = (content.match(/^\/\* PLATFORM:mobile \*\/$/gm) || []).length;
  const mClose = (content.match(/^\/\* \/PLATFORM:mobile \*\/$/gm) || []).length;
  assert.equal(mOpen, mClose,
    `Unbalanced mobile markers: ${mOpen} opens vs ${mClose} closes`);
});

test("Built desktop CSS has no PLATFORM markers or mobile-only selectors", () => {
  const html = readFile("apps/web-root/d/index.html");
  assert.ok(html, "Could not read desktop build output");
  assert.ok(!html.includes("PLATFORM:desktop"), "Desktop build still contains PLATFORM:desktop marker");
  assert.ok(!html.includes("PLATFORM:mobile"), "Desktop build still contains PLATFORM:mobile marker");
  // Extract the CSS (inside <style>…</style>) to check for mobile-only selectors.
  // JS may legitimately reference mobile class names as querySelector strings.
  const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  if (cssMatch) {
    assert.ok(!cssMatch[1].includes("mobile-action-grid"),
      "Desktop CSS contains mobile-only .mobile-action-grid selector");
  }
});

test("Built mobile CSS has no PLATFORM markers or desktop-only selectors", () => {
  const html = readFile("apps/web-root/m/index.html");
  assert.ok(html, "Could not read mobile build output");
  assert.ok(!html.includes("PLATFORM:desktop"), "Mobile build still contains PLATFORM:desktop marker");
  assert.ok(!html.includes("PLATFORM:mobile"), "Mobile build still contains PLATFORM:mobile marker");
  const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  if (cssMatch) {
    assert.ok(!cssMatch[1].includes("tab-btn.rename"),
      "Mobile CSS contains desktop-only .tab-btn.rename selector");
  }
});

test("Tauri HTML has no PLATFORM markers or mobile-only selectors", () => {
  const html = readFile("apps/desktop-tauri/src/index.html");
  assert.ok(html, "Could not read Tauri build output");
  assert.ok(!html.includes("PLATFORM:desktop"), "Tauri build still contains PLATFORM:desktop marker");
  assert.ok(!html.includes("PLATFORM:mobile"), "Tauri build still contains PLATFORM:mobile marker");
  const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  if (cssMatch) {
    assert.ok(!cssMatch[1].includes("mobile-action-grid"),
      "Tauri CSS contains mobile-only .mobile-action-grid selector");
  }
});

test("package.json version matches app.shared.js APP_VERSION", () => {
  const pkgVersion = getPackageVersion();
  const appVersion = getSharedAppJsVersion();
  assert.equal(pkgVersion, appVersion,
    `package.json (${pkgVersion}) != app.shared.js (${appVersion})`);
});

test("Built desktop JS contains PLATFORM = desktop (no placeholder)", () => {
  const html = readFile("apps/web-root/d/index.html");
  assert.ok(html, "Could not read desktop build output");
  assert.ok(!html.includes("__PLATFORM__"), "Desktop build still contains __PLATFORM__ placeholder");
});

test("Built mobile JS contains PLATFORM = mobile (no placeholder)", () => {
  const html = readFile("apps/web-root/m/index.html");
  assert.ok(html, "Could not read mobile build output");
  assert.ok(!html.includes("__PLATFORM__"), "Mobile build still contains __PLATFORM__ placeholder");
});

test("package.json version matches tauri.conf.json", () => {
  const pkgVersion = getPackageVersion();
  const tauriVersion = getTauriVersion();
  if (!tauriVersion) {
    // tauri.conf.json might not exist in all environments
    console.log("        (skipped — tauri.conf.json not found)");
    return;
  }
  assert.equal(pkgVersion, tauriVersion,
    `package.json (${pkgVersion}) != tauri.conf.json (${tauriVersion})`);
});

test("Desktop index.html about dialog matches version", () => {
  const version = getPackageVersion();
  const html = readFile("apps/web-desktop/src/index.html");
  assert.ok(html, "Could not read desktop index.html");
  assert.ok(html.includes(`Shirt Tracker v${version}`),
    `Desktop index.html missing "Shirt Tracker v${version}" in about dialog`);
});

test("Mobile index.html about dialog matches version", () => {
  const version = getPackageVersion();
  const html = readFile("apps/web-mobile/src/index.html");
  assert.ok(html, "Could not read mobile index.html");
  assert.ok(html.includes(`Shirt Tracker v${version}`),
    `Mobile index.html missing "Shirt Tracker v${version}" in about dialog`);
});

console.log("\n--- _redirects File ---\n");

test("_redirects contains device routing rules", () => {
  const redirects = readFile("apps/web-root/_redirects");
  assert.ok(redirects, "Could not read _redirects");
  assert.ok(redirects.includes("/ /m/ 302"), "Missing mobile redirect rule");
  assert.ok(redirects.includes("/ /d/ 302"), "Missing desktop redirect rule");
});

test("_redirects contains SPA fallback rules", () => {
  const redirects = readFile("apps/web-root/_redirects");
  assert.ok(redirects, "Could not read _redirects");
  assert.ok(redirects.includes("/m/* /m/index.html 200"), "Missing mobile SPA fallback");
  assert.ok(redirects.includes("/d/* /d/index.html 200"), "Missing desktop SPA fallback");
});

test("_redirects contains auth redirect rules", () => {
  const redirects = readFile("apps/web-root/_redirects");
  assert.ok(redirects, "Could not read _redirects");
  assert.ok(redirects.includes("?type=invite"), "Missing invite auth redirect");
  assert.ok(redirects.includes("?type=recovery"), "Missing recovery auth redirect");
});

// ═══════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════

console.log("\n" + "=".repeat(50));
console.log(`  ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log("\nFailed tests:");
  for (const f of failures) {
    console.log(`  - ${f.name}: ${f.message}`);
  }
  console.log("");
  process.exit(1);
} else {
  console.log("  All tests passed.\n");
}
