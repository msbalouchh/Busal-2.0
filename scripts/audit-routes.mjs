import fs from "fs";
import path from "path";

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name === "page.tsx") acc.push(p);
  }
  return acc;
}

function toRoute(filePath) {
  let r = filePath.replace(/\\/g, "/").replace("src/app/", "").replace("/page.tsx", "");
  r = r.replace(/\([^)]+\)\/?/g, "");
  return "/" + r;
}

const pages = walk("src/app").map(toRoute);
const pageSet = new Set(pages);

function walkFiles(dir, pattern, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== "node_modules") walkFiles(p, pattern, acc);
    else if (pattern.test(e.name)) acc.push(p);
  }
  return acc;
}

const routePaths = new Map();

function addRoute(route, file) {
  const clean = route.split("?")[0].split("#")[0];
  if (!routePaths.has(clean)) routePaths.set(clean, file);
}

function extractFromFile(file) {
  const content = fs.readFileSync(file, "utf8");
  const staticRe =
    /["'`](\/(?:app|dashboard|control-center|login|signup|onboarding|business-onboarding|menu|qr|proposals|implementation|dev|forgot-password|reset-password|verify-email)[^"'`\s]*?)["'`]/g;
  let m;
  while ((m = staticRe.exec(content))) {
    if (!m[1].includes("${")) addRoute(m[1], file);
  }

  const templateRe = /`(\/(?:app|dashboard|control-center)[^`]*?\$\{[^}]+\}[^`]*)`/g;
  while ((m = templateRe.exec(content))) {
    const pattern = m[1].replace(/\$\{[^}]+\}/g, "__PARAM__").split("?")[0];
    addRoute(pattern, file);
  }
}

for (const file of walkFiles("src", /routes\.ts$/)) {
  extractFromFile(file.replace(/\\/g, "/"));
}

for (const file of walkFiles("src", /navigation.*\.ts$/)) {
  extractFromFile(file.replace(/\\/g, "/"));
}

extractFromFile("src/components/layout/application-shell-config.ts");

function matchesDynamic(route, href) {
  const rp = route.split("/").filter(Boolean);
  const hp = href.split("/").filter(Boolean);
  if (rp.length !== hp.length) return false;
  for (let i = 0; i < rp.length; i++) {
    if (rp[i].startsWith("[") && rp[i].endsWith("]")) continue;
    if (rp[i] === "__PARAM__") continue;
    if (rp[i] !== hp[i]) return false;
  }
  return true;
}

function routeExists(href) {
  if (pageSet.has(href)) return true;
  for (const p of pageSet) {
    if (matchesDynamic(p, href)) return true;
  }
  return false;
}

const broken = [];
for (const [route, file] of routePaths) {
  if (!routeExists(route)) {
    broken.push({ route, file: file.replace(/\\/g, "/") });
  }
}

broken.sort((a, b) => a.route.localeCompare(b.route));

console.log(
  JSON.stringify(
    {
      totalPages: pages.length,
      totalRouteRefs: routePaths.size,
      brokenCount: broken.length,
      broken,
    },
    null,
    2,
  ),
);
