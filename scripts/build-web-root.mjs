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

# Clean /m and /d paths
/m /m/ 301
/d /d/ 301

# Route /d to /m on mobile
/d/* /m/:splat 302 User-Agent=Android|iPhone|iPad|iPod|Mobile

# Route /m to /d on desktop
/m/* /d/:splat 302 User-Agent=Windows|Macintosh|Linux|X11

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

/**
 * Inline style.css and app.js back into index.html to produce a single-file output.
 * Replaces <link rel="stylesheet" href="style.css"> with <style>…</style>
 * Replaces <script src="app.js"></script> with <script>…</script>
 * Then deletes the separate style.css and app.js files from the output directory.
 */
const inlineSources = (dir) => {
  const htmlPath = path.join(dir, "index.html");
  const cssPath = path.join(dir, "style.css");
  const jsPath = path.join(dir, "app.js");

  // If there's no separate style.css / app.js, the source is still a single file — skip.
  if (!fs.existsSync(cssPath) && !fs.existsSync(jsPath)) return;

  let html = fs.readFileSync(htmlPath, "utf8");

  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, "utf8");
    // Indent CSS to match original formatting (6 spaces inside <style>)
    const indentedCss = css.split("\n").map(l => l ? "      " + l : l).join("\n");
    html = html.replace(
      /^[ \t]*<link rel="stylesheet" href="style\.css">\s*$/m,
      `    <style>\n${indentedCss}\n    </style>`
    );
    fs.rmSync(cssPath);
  }

  if (fs.existsSync(jsPath)) {
    const js = fs.readFileSync(jsPath, "utf8");
    const indentedJs = js.split("\n").map(l => l ? "      " + l : l).join("\n");
    html = html.replace(
      /^[ \t]*<script src="app\.js"><\/script>\s*$/m,
      `    <script>\n${indentedJs}\n    </script>`
    );
    fs.rmSync(jsPath);
  }

  fs.writeFileSync(htmlPath, html, "utf8");
};

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

copyDir(desktopSrc, outDesktop);
copyDir(mobileSrc, outMobile);

// Inject CHANGELOG.json into app.js before inlining
const changelogPath = path.join(root, "CHANGELOG.json");
if (fs.existsSync(changelogPath)) {
  const changelogJson = fs.readFileSync(changelogPath, "utf8").trim();
  const marker = "/* __CHANGELOG_INJECT__ */ []";
  for (const dir of [outDesktop, outMobile]) {
    const jsPath = path.join(dir, "app.js");
    if (fs.existsSync(jsPath)) {
      const source = fs.readFileSync(jsPath, "utf8");
      fs.writeFileSync(jsPath, source.replace(marker, changelogJson), "utf8");
    }
  }
}

// Inline CSS/JS back into single-file HTML for deployment
inlineSources(outDesktop);
inlineSources(outMobile);

const lastCommitDate = getLastCommitDate();
injectLastCommitDate(path.join(outDesktop, "index.html"), lastCommitDate);
injectLastCommitDate(path.join(outMobile, "index.html"), lastCommitDate);

fs.writeFileSync(path.join(outDir, "_redirects"), redirects, "utf8");
console.log(`Wrote Netlify publish folder to ${outDir}`);
