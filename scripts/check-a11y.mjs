import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const appRoot = path.join(repoRoot, "src", "app");

const issues = [];
const tsxFiles = collectFiles(appRoot).filter((file) => file.endsWith(".tsx"));

const combinedSource = tsxFiles.map((filePath) => fs.readFileSync(filePath, "utf8")).join("\n");
const layoutPath = path.join(appRoot, "layout.tsx");
const layoutContent = fs.readFileSync(layoutPath, "utf8");

if (!/<html[^>]*lang="[^"]+"/.test(layoutContent)) {
  issues.push(`${path.relative(repoRoot, layoutPath)}: Root layout should set an explicit html lang attribute.`);
}

if (!/<main\b/.test(combinedSource)) {
  issues.push("src/app: Expected at least one <main> landmark in the app source.");
}

if (!/(<Heading\b[^>]*level=\{1\}|<h1\b)/.test(combinedSource)) {
  issues.push("src/app: Expected at least one top-level heading.");
}

for (const filePath of tsxFiles) {
  const relative = path.relative(repoRoot, filePath);
  const content = fs.readFileSync(filePath, "utf8");

  const imgTags = content.match(/<img\b[^>]*>/g) ?? [];
  for (const tag of imgTags) {
    if (!/\balt=/.test(tag)) {
      issues.push(`${relative}: <img> elements must include an alt attribute.`);
    }
  }

  const targetBlankAnchors = content.match(/<a\b[^>]*target="_blank"[^>]*>/g) ?? [];
  for (const tag of targetBlankAnchors) {
    if (!/\brel=/.test(tag)) {
      issues.push(`${relative}: target=\"_blank\" links should declare rel attributes.`);
    }
  }
}

if (issues.length > 0) {
  console.error("Accessibility checks failed:\n");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Accessibility checks passed across ${tsxFiles.length} files.`);

function collectFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }
    files.push(fullPath);
  }
  return files;
}
