import fs from "fs";
import path from "path";

const root = process.cwd();
const desktopSrc = path.join(root, "apps", "web-desktop", "src");
const mobileSrc = path.join(root, "apps", "web-mobile", "src");
const outDir = path.join(root, "apps", "web-root");
const outDesktop = path.join(outDir, "d");
const outMobile = path.join(outDir, "m");

const redirects = `# Device routing
/ /m/ 302 User-Agent=Android|iPhone|iPad|iPod|Mobile
/ /d/ 302

# Clean /m and /d paths
/m /m/ 301
/d /d/ 301

# SPA fallbacks
/m/* /m/index.html 200
/d/* /d/index.html 200
`;

const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) {
    throw new Error(`Missing source directory: ${src}`);
  }
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
};

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

copyDir(desktopSrc, outDesktop);
copyDir(mobileSrc, outMobile);

fs.writeFileSync(path.join(outDir, "_redirects"), redirects, "utf8");
console.log(`Wrote Netlify publish folder to ${outDir}`);
