import fs from "fs";
import path from "path";

const root = process.cwd();
const sourcePath = path.join(root, "apps", "web-desktop", "src", "index.html");
const targetPath = path.join(root, "apps", "desktop-tauri", "src", "index.html");
const sourceAssets = path.join(root, "apps", "web-desktop", "src", "assets");
const targetAssets = path.join(root, "apps", "desktop-tauri", "src", "assets");
const sourceFonts = path.join(root, "apps", "web-desktop", "src", "fonts");
const targetFonts = path.join(root, "apps", "desktop-tauri", "src", "fonts");
const sourceManifest = path.join(root, "apps", "web-desktop", "src", "manifest.webmanifest");
const targetManifest = path.join(root, "apps", "desktop-tauri", "src", "manifest.webmanifest");
const sourceSteve = path.join(root, "apps", "web-desktop", "src", "steve.png");
const targetSteve = path.join(root, "apps", "desktop-tauri", "src", "steve.png");

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Source file not found: ${sourcePath}`);
}

fs.copyFileSync(sourcePath, targetPath);

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
console.log(`Synced assets -> ${targetAssets}`);
console.log(`Synced fonts -> ${targetFonts}`);
if (fs.existsSync(sourceManifest)) console.log(`Synced ${sourceManifest} -> ${targetManifest}`);
if (fs.existsSync(sourceSteve)) console.log(`Synced ${sourceSteve} -> ${targetSteve}`);
