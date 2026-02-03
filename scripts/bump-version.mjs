import fs from "fs";
import path from "path";

const root = process.cwd();
const tauriConfigPath = path.join(
  root,
  "apps",
  "desktop-tauri",
  "src-tauri",
  "tauri.conf.json"
);
const htmlPaths = [
  path.join(root, "apps", "desktop-tauri", "src", "index.html"),
  path.join(root, "apps", "web-desktop", "src", "index.html"),
  path.join(root, "apps", "web-mobile", "src", "index.html"),
];

const readJson = (filePath) => {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
};

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
};

const bumpVersion = (current) => {
  const match = String(current).trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Unsupported version format: ${current}`);
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const nextMinor = minor + 1;
  const shortVersion = `${major}.${nextMinor}`;
  const fullVersion = `${major}.${nextMinor}.0`;
  return { shortVersion, fullVersion };
};

const updateHtml = (filePath, shortVersion, fullVersion) => {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, "utf8");

  html = html.replace(
    /const APP_VERSION = "[^"]+";/,
    `const APP_VERSION = "${fullVersion}";`
  );

  html = html.replace(
    /version:\s*"\d+\.\d+\.\d+"/g,
    `version: "${fullVersion}"`
  );

  html = html.replace(
    /Shirt Tracker v\d+\.\d+\s+beta/g,
    `Shirt Tracker v${shortVersion} beta`
  );

  html = html.replace(
    /v\d+\.\d+\s+beta/g,
    `v${shortVersion} beta`
  );

  fs.writeFileSync(filePath, html, "utf8");
};

const tauriConfig = readJson(tauriConfigPath);
const currentVersion = tauriConfig.version;
const { shortVersion, fullVersion } = bumpVersion(currentVersion);

tauriConfig.version = fullVersion;
if (tauriConfig.app && Array.isArray(tauriConfig.app.windows) && tauriConfig.app.windows[0]) {
  tauriConfig.app.windows[0].title = `Shirt Tracker v${shortVersion} beta`;
}
writeJson(tauriConfigPath, tauriConfig);

htmlPaths.forEach((filePath) => updateHtml(filePath, shortVersion, fullVersion));

console.log(`Bumped version to ${shortVersion} beta (${fullVersion})`);
