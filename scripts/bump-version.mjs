import fs from "fs";
import path from "path";

const root = process.cwd();

// --- Read the new version from the command line ---
const newVersion = process.argv[2];
if (!newVersion) {
  console.error("Usage: node scripts/bump-version.mjs <version>");
  console.error("Example: node scripts/bump-version.mjs 2.0.2");
  process.exit(1);
}

// --- Make sure it looks like a valid version (e.g. 2.0.2) ---
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error(`Invalid version format: "${newVersion}"`);
  console.error("Version must be three numbers separated by dots, like 2.0.2");
  process.exit(1);
}

// --- Define the 5 source files and what to replace in each ---

const tauriConfigPath = path.join(
  root, "apps", "desktop-tauri", "src-tauri", "tauri.conf.json"
);

const desktopAppJs = path.join(root, "apps", "web-desktop", "src", "app.js");
const mobileAppJs = path.join(root, "apps", "web-mobile", "src", "app.js");
const desktopHtml = path.join(root, "apps", "web-desktop", "src", "index.html");
const mobileHtml = path.join(root, "apps", "web-mobile", "src", "index.html");

// Each entry: [regex to find, replacement string, human-readable description]
const appJsReplacements = [
  [
    /const APP_VERSION = "[^"]+";/,
    `const APP_VERSION = "${newVersion}";`,
    "APP_VERSION constant",
  ],
  [
    /version:\s*"\d+\.\d+\.\d+"/,
    `version: "${newVersion}"`,
    "backup metadata version",
  ],
];

const htmlReplacements = [
  [
    /Shirt Tracker v[\d.]+/,
    `Shirt Tracker v${newVersion}`,
    "about dialog version text",
  ],
];

// --- Helper: apply a list of replacements to a file ---
const applyReplacements = (filePath, replacements) => {
  if (!fs.existsSync(filePath)) {
    console.error(`  WARNING: File not found, skipping: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  const shortPath = path.relative(root, filePath);
  let changed = false;

  for (const [regex, replacement, description] of replacements) {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      console.log(`  ✓ ${shortPath} — updated ${description}`);
      changed = true;
    } else {
      console.error(`  WARNING: ${shortPath} — could not find ${description}`);
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
  }
};

// --- 1. Update tauri.conf.json (parsed as JSON, not regex) ---
console.log(`\nBumping version to ${newVersion}\n`);

if (fs.existsSync(tauriConfigPath)) {
  const raw = fs.readFileSync(tauriConfigPath, "utf8");
  const config = JSON.parse(raw);
  const oldVersion = config.version;
  config.version = newVersion;

  // Update window title if it exists
  if (config.app && Array.isArray(config.app.windows) && config.app.windows[0]) {
    config.app.windows[0].title = `Shirt Tracker v${newVersion}`;
  }

  fs.writeFileSync(tauriConfigPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  const shortPath = path.relative(root, tauriConfigPath);
  console.log(`  ✓ ${shortPath} — updated version (${oldVersion} → ${newVersion})`);
} else {
  console.error(`  WARNING: tauri.conf.json not found at ${tauriConfigPath}`);
}

// --- 2. Update the two app.js files ---
applyReplacements(desktopAppJs, appJsReplacements);
applyReplacements(mobileAppJs, appJsReplacements);

// --- 3. Update the two index.html files ---
applyReplacements(desktopHtml, htmlReplacements);
applyReplacements(mobileHtml, htmlReplacements);

// --- 4. Verify: re-read files and confirm the new version is present ---
console.log("\nVerifying...\n");

const verifications = [
  [tauriConfigPath, `"version": "${newVersion}"`],
  [desktopAppJs, `const APP_VERSION = "${newVersion}"`],
  [mobileAppJs, `const APP_VERSION = "${newVersion}"`],
  [desktopAppJs, `version: "${newVersion}"`],
  [mobileAppJs, `version: "${newVersion}"`],
  [desktopHtml, `Shirt Tracker v${newVersion}`],
  [mobileHtml, `Shirt Tracker v${newVersion}`],
];

let allGood = true;
for (const [filePath, expectedString] of verifications) {
  const shortPath = path.relative(root, filePath);
  if (!fs.existsSync(filePath)) {
    console.error(`  FAIL: ${shortPath} — file not found`);
    allGood = false;
    continue;
  }
  const content = fs.readFileSync(filePath, "utf8");
  if (content.includes(expectedString)) {
    console.log(`  ✓ ${shortPath} — contains "${expectedString}"`);
  } else {
    console.error(`  FAIL: ${shortPath} — missing "${expectedString}"`);
    allGood = false;
  }
}

if (allGood) {
  console.log(`\nDone! All 7 version locations updated to ${newVersion}.\n`);
} else {
  console.error("\nWARNING: Some verifications failed. Check the output above.\n");
  process.exit(1);
}
