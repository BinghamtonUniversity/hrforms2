// scripts/build-json.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const pkgPath = path.join(root, "package.json");
const distDir = path.join(root, "dist");

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const payload = {
  VERSION: pkg.version || "",
  REVISION: pkg.revision || "",
  BUILD_TIME: new Date().toISOString(),
};

fs.mkdirSync(distDir, { recursive: true });
const outPath = path.join(distDir, "build_info.json");

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
console.log(`Wrote ${outPath}\n`);