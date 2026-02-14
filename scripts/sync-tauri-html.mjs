import fs from "fs";
import path from "path";

const root = process.cwd();
const sourceDir = path.join(root, "apps", "web-desktop", "src");
const sourcePath = path.join(sourceDir, "index.html");
const sourceCss = path.join(sourceDir, "style.css");
const sourceJs = path.join(sourceDir, "app.js");
const targetPath = path.join(root, "apps", "desktop-tauri", "src", "index.html");
const sourceAssets = path.join(sourceDir, "assets");
const targetAssets = path.join(root, "apps", "desktop-tauri", "src", "assets");
const sourceFonts = path.join(sourceDir, "fonts");
const targetFonts = path.join(root, "apps", "desktop-tauri", "src", "fonts");
const sourceManifest = path.join(sourceDir, "manifest.webmanifest");
const targetManifest = path.join(root, "apps", "desktop-tauri", "src", "manifest.webmanifest");
const sourceSteve = path.join(sourceDir, "steve.png");
const targetSteve = path.join(root, "apps", "desktop-tauri", "src", "steve.png");

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Source file not found: ${sourcePath}`);
}

const formatLocalDateTime = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

let html = fs.readFileSync(sourcePath, "utf8");

// Inline style.css and app.js into the HTML to produce a single-file output for Tauri
if (fs.existsSync(sourceCss)) {
  const css = fs.readFileSync(sourceCss, "utf8");
  const indentedCss = css.split("\n").map(l => l ? "      " + l : l).join("\n");
  html = html.replace(
    /^[ \t]*<link rel="stylesheet" href="style\.css">\s*$/m,
    `    <style>\n${indentedCss}\n    </style>`
  );
}

if (fs.existsSync(sourceJs)) {
  const js = fs.readFileSync(sourceJs, "utf8");
  const indentedJs = js.split("\n").map(l => l ? "      " + l : l).join("\n");
  html = html.replace(
    /^[ \t]*<script src="app\.js"><\/script>\s*$/m,
    `    <script>\n${indentedJs}\n    </script>`
  );
}

const buildTimestamp = new Date();
const buildIso = buildTimestamp.toISOString();
const buildLocal = formatLocalDateTime(buildTimestamp);

html = html.replace(
  /const LAST_COMMIT_DATE = "[^"]+";/,
  `const LAST_COMMIT_DATE = "${buildIso}";`
);

html = html.replace(
  /id="app-update-date" value="[^"]*"/,
  `id="app-update-date" value="${buildLocal}"`
);

fs.writeFileSync(targetPath, html, "utf8");

if (fs.existsSync(sourceAssets)) {
  fs.cpSync(sourceAssets, targetAssets, { recursive: true });
}

if (fs.existsSync(sourceFonts)) {
  fs.cpSync(sourceFonts, targetFonts, { recursive: true });
}

if (fs.existsSync(sourceManifest)) {
  fs.copyFileSync(sourceManifest, targetManifest);
}

if (fs.existsSync(sourceSteve)) {
  fs.copyFileSync(sourceSteve, targetSteve);
}

console.log(`Synced ${sourcePath} -> ${targetPath}`);
console.log(`Updated desktop app Last Deployment to ${buildLocal}`);
console.log(`Synced assets -> ${targetAssets}`);
console.log(`Synced fonts -> ${targetFonts}`);
if (fs.existsSync(sourceManifest)) console.log(`Synced ${sourceManifest} -> ${targetManifest}`);
if (fs.existsSync(sourceSteve)) console.log(`Synced ${sourceSteve} -> ${targetSteve}`);
