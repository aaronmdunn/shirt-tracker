import fs from "fs";
import path from "path";

const deployDate = process.env.NETLIFY_DEPLOY_DATE || new Date().toISOString();
const targetPaths = [
  path.resolve("apps", "web-desktop", "src", "index.html"),
  path.resolve("apps", "web-mobile", "src", "index.html"),
];

targetPaths.forEach((targetPath) => {
  if (!fs.existsSync(targetPath)) return;
  const html = fs.readFileSync(targetPath, "utf8");
  const updated = html.replace(
    /__NETLIFY_DEPLOY_DATE__/g,
    deployDate.replace(/"/g, "")
  );
  fs.writeFileSync(targetPath, updated, "utf8");
  console.log(`Stamped deploy date into ${targetPath}`);
});
