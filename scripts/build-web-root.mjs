import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import esbuild from "esbuild";

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

const redirects = `# Auth callbacks and share links — route to JS redirect page that preserves hash + query params
/?type=invite /auth-redirect.html 200
/?type=recovery /auth-redirect.html 200
/?type=email_change /auth-redirect.html 200
/?type=signup /auth-redirect.html 200
/?share=:share /auth-redirect.html 200

# Device routing
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
    // Escape </style sequences so the HTML parser doesn't close the tag early
    const css = fs.readFileSync(cssPath, "utf8").replace(/<\/style/gi, "<\\/style");
    // Use a replacement function (not a string) so that $ sequences in the CSS
    // are not interpreted as special replacement patterns by String.prototype.replace.
    html = html.replace(
      /^[ \t]*<link rel="stylesheet" href="style\.css">\s*$/m,
      () => `    <style>\n${css}\n    </style>`
    );
    fs.rmSync(cssPath);
  }

  if (fs.existsSync(jsPath)) {
    // Escape </script sequences so the HTML parser doesn't close the tag early
    const js = fs.readFileSync(jsPath, "utf8").replace(/<\/script/gi, "<\\/script");
    // Use a replacement function (not a string) so that $ sequences in minified JS
    // (e.g. $& meaning "matched text") are not expanded by String.prototype.replace.
    html = html.replace(
      /^[ \t]*<script src="app\.js"><\/script>\s*$/m,
      () => `    <script>\n${js}\n    </script>`
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

// Minify CSS and JS before inlining
const minifyFile = async (filePath, loader) => {
  if (!fs.existsSync(filePath)) return;
  const source = fs.readFileSync(filePath, "utf8");
  const result = await esbuild.transform(source, {
    loader,
    minify: true,
    // Keep legal comments (licenses) but strip everything else
    legalComments: "inline",
  });
  fs.writeFileSync(filePath, result.code, "utf8");
};

for (const dir of [outDesktop, outMobile]) {
  await minifyFile(path.join(dir, "app.js"), "js");
  await minifyFile(path.join(dir, "style.css"), "css");
}

// Inline CSS/JS back into single-file HTML for deployment
inlineSources(outDesktop);
inlineSources(outMobile);

const lastCommitDate = getLastCommitDate();
injectLastCommitDate(path.join(outDesktop, "index.html"), lastCommitDate);
injectLastCommitDate(path.join(outMobile, "index.html"), lastCommitDate);

fs.writeFileSync(path.join(outDir, "_redirects"), redirects, "utf8");

const authRedirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting \u2014 Shirt Tracker</title>
  <style>
    body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; background: #f5f5f5; color: #666; }
  </style>
</head>
<body>
  <p>Redirecting&hellip;</p>
  <script>
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const base = isMobile ? "/m/" : "/d/";
    const destination = base + window.location.search + window.location.hash;
    window.location.replace(destination);
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, "auth-redirect.html"), authRedirectHtml, "utf8");
console.log(`Wrote Netlify publish folder to ${outDir}`);
