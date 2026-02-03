import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();
const desktopSrc = path.join(root, "apps", "web-desktop", "src");
const mobileSrc = path.join(root, "apps", "web-mobile", "src");
const outDir = path.join(root, "apps", "web-root");
const outDesktop = path.join(outDir, "d");
const outMobile = path.join(outDir, "m");

const getLastCommitDate = () => {
  try {
    return execSync("git log -1 --format=%cI", { encoding: "utf8" }).trim();
  } catch (error) {
    return "";
  }
};

const injectLastCommitDate = (filePath, lastCommitDate) => {
  if (!lastCommitDate) return;
  if (!fs.existsSync(filePath)) return;
  const source = fs.readFileSync(filePath, "utf8");
  const updated = source
    .replace(/const LAST_COMMIT_DATE = "[^"]*";/, `const LAST_COMMIT_DATE = "${lastCommitDate}";`)
    .replace(/<input type="text" id="app-update-date" value="[^"]*" readonly>/, (match) => match);
  fs.writeFileSync(filePath, updated, "utf8");
};

const redirects = `# Device routing
/ /m/ 302 User-Agent=Android|iPhone|iPad|iPod|Mobile
/ /d/ 302

# Route /d to /m on mobile
/d/* /m/ 302 User-Agent=Android|iPhone|iPad|iPod|Mobile

# Route /m to /d on desktop
/m/* /d/ 302 User-Agent=Windows|Macintosh|Linux|X11

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

const lastCommitDate = getLastCommitDate();
injectLastCommitDate(path.join(outDesktop, "index.html"), lastCommitDate);
injectLastCommitDate(path.join(outMobile, "index.html"), lastCommitDate);

fs.writeFileSync(path.join(outDir, "_redirects"), redirects, "utf8");
console.log(`Wrote Netlify publish folder to ${outDir}`);
