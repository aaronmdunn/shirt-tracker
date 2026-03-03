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

// --- Define the 8 source files and what to replace in each ---

const packageJsonPath = path.join(root, "package.json");
const packageLockPath = path.join(root, "package-lock.json");
const tauriConfigPath = path.join(
  root, "apps", "desktop-tauri", "src-tauri", "tauri.conf.json"
);
const cargoTomlPath = path.join(
  root, "apps", "desktop-tauri", "src-tauri", "Cargo.toml"
);
const cargoLockPath = path.join(
  root, "apps", "desktop-tauri", "src-tauri", "Cargo.lock"
);

const sharedAppJs = path.join(root, "apps", "shared", "app.shared.js");
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

// --- 1. Update package.json ---
console.log(`\nBumping version to ${newVersion}\n`);

if (fs.existsSync(packageJsonPath)) {
  const raw = fs.readFileSync(packageJsonPath, "utf8");
  const pkg = JSON.parse(raw);
  const oldVersion = pkg.version;
  pkg.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  const shortPath = path.relative(root, packageJsonPath);
  console.log(`  ✓ ${shortPath} — updated version (${oldVersion} → ${newVersion})`);
} else {
  console.error(`  WARNING: package.json not found at ${packageJsonPath}`);
}

// --- 2. Update package-lock.json ---
if (fs.existsSync(packageLockPath)) {
  let lockContent = fs.readFileSync(packageLockPath, "utf8");
  const shortPath = path.relative(root, packageLockPath);

  // The root-level "version" and packages[""]["version"] both need updating.
  // They appear as the only top-level version fields before lockfileVersion and
  // inside the "" package entry. We use a targeted regex for safety.
  const lockRootRegex = /^(\s*"name":\s*"shirt-tracker",\s*\n\s*"version":\s*)"[^"]+"/gm;
  const matchCount = (lockContent.match(lockRootRegex) || []).length;

  if (matchCount === 2) {
    lockContent = lockContent.replace(lockRootRegex, `$1"${newVersion}"`);
    fs.writeFileSync(packageLockPath, lockContent, "utf8");
    console.log(`  ✓ ${shortPath} — updated both version fields`);
  } else {
    console.error(`  WARNING: ${shortPath} — expected 2 version fields after "shirt-tracker", found ${matchCount}`);
  }
} else {
  console.error(`  WARNING: package-lock.json not found at ${packageLockPath}`);
}

// --- 3. Update tauri.conf.json (version + window title) ---
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
  console.log(`  ✓ ${shortPath} — updated version + window title (${oldVersion} → ${newVersion})`);
} else {
  console.error(`  WARNING: tauri.conf.json not found at ${tauriConfigPath}`);
}

// --- 4. Update Cargo.toml ---
if (fs.existsSync(cargoTomlPath)) {
  let tomlContent = fs.readFileSync(cargoTomlPath, "utf8");
  const shortPath = path.relative(root, cargoTomlPath);

  // Only match the version line directly under [package] — it's the first
  // version = "..." in the file, before any [dependencies] sections.
  const tomlRegex = /^(version\s*=\s*)"[^"]+"$/m;
  if (tomlRegex.test(tomlContent)) {
    const oldMatch = tomlContent.match(tomlRegex);
    tomlContent = tomlContent.replace(tomlRegex, `$1"${newVersion}"`);
    fs.writeFileSync(cargoTomlPath, tomlContent, "utf8");
    console.log(`  ✓ ${shortPath} — updated version (${oldMatch[0]} → version = "${newVersion}")`);
  } else {
    console.error(`  WARNING: ${shortPath} — could not find version field`);
  }
} else {
  console.error(`  WARNING: Cargo.toml not found at ${cargoTomlPath}`);
}

// --- 5. Update Cargo.lock (shirt-tracker package entry only) ---
if (fs.existsSync(cargoLockPath)) {
  let lockContent = fs.readFileSync(cargoLockPath, "utf8");
  const shortPath = path.relative(root, cargoLockPath);

  // Match the shirt-tracker package block and update its version line.
  // The block looks like:
  //   [[package]]
  //   name = "shirt-tracker"
  //   version = "X.Y.Z"
  const cargoLockRegex = /(name = "shirt-tracker"\nversion = )"[^"]+"/;
  if (cargoLockRegex.test(lockContent)) {
    lockContent = lockContent.replace(cargoLockRegex, `$1"${newVersion}"`);
    fs.writeFileSync(cargoLockPath, lockContent, "utf8");
    console.log(`  ✓ ${shortPath} — updated shirt-tracker package version`);
  } else {
    console.error(`  WARNING: ${shortPath} — could not find shirt-tracker package entry`);
  }
} else {
  console.error(`  WARNING: Cargo.lock not found at ${cargoLockPath}`);
}

// --- 6. Update the shared app.js ---
applyReplacements(sharedAppJs, appJsReplacements);

// --- 7. Update the two index.html files ---
applyReplacements(desktopHtml, htmlReplacements);
applyReplacements(mobileHtml, htmlReplacements);

// --- 8. Verify: re-read files and confirm the new version is present ---
console.log("\nVerifying...\n");

const verifications = [
  [packageJsonPath, `"version": "${newVersion}"`],
  [packageLockPath, `"version": "${newVersion}"`],
  [tauriConfigPath, `"version": "${newVersion}"`],
  [tauriConfigPath, `Shirt Tracker v${newVersion}`],
  [cargoTomlPath, `version = "${newVersion}"`],
  [cargoLockPath, `version = "${newVersion}"`],
  [sharedAppJs, `const APP_VERSION = "${newVersion}"`],
  [sharedAppJs, `version: "${newVersion}"`],
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
  console.log(`\nDone! All ${verifications.length} version locations updated to ${newVersion}.\n`);
} else {
  console.error("\nWARNING: Some verifications failed. Check the output above.\n");
  process.exit(1);
}
