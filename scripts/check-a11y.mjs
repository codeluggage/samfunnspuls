import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const targetArgs = process.argv.slice(2);
const targets = resolveTargets(targetArgs.length > 0 ? targetArgs : [path.join("src", "app")]);

const issues = [];
const tsxFiles = collectTargetFiles(targets).filter((file) => file.endsWith(".tsx"));

const combinedSource = tsxFiles.map((filePath) => fs.readFileSync(filePath, "utf8")).join("\n");
const layoutFiles = tsxFiles.filter((filePath) => path.basename(filePath) === "layout.tsx");

for (const layoutPath of layoutFiles) {
  const layoutContent = fs.readFileSync(layoutPath, "utf8");
  if (!/<html[^>]*lang="[^"]+"/.test(layoutContent)) {
    issues.push(`${path.relative(repoRoot, layoutPath)}: Root layout should set an explicit html lang attribute.`);
  }
}

if (tsxFiles.length > 0 && !/<main\b/.test(combinedSource)) {
  issues.push("Target source: Expected at least one <main> landmark.");
}

if (tsxFiles.length > 0 && !/(<Heading\b[^>]*level=\{1\}|<h1\b)/.test(combinedSource)) {
  issues.push("Target source: Expected at least one top-level heading.");
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

  const searchInputs = content.match(/<Search\.Input\b[^>]*>/g) ?? [];
  for (const tag of searchInputs) {
    if (!/\b(?:label|aria-label|aria-labelledby)=/.test(tag)) {
      issues.push(`${relative}: Search.Input should expose a visible label or explicit accessible name.`);
    }
  }

  const formControls = collectJsxOpeningTags(content, [
    "DateInput",
    "Input",
    "Search.Input",
    "Select",
    "Textarea",
    "Textfield",
  ]);
  for (const { componentName, tag } of formControls) {
    if (!/\bid=/.test(tag) || !/\bname=/.test(tag)) {
      issues.push(`${relative}: ${componentName} should include id and name so rendered form fields are labelable and inspectable.`);
    }
  }

  const textareas = content.match(/<textarea\b[^>]*>/g) ?? [];
  for (const tag of textareas) {
    if (!/\b(?:aria-label|aria-labelledby)=/.test(tag) && !/<(?:Label|Field)\b/.test(content)) {
      issues.push(`${relative}: Raw textarea needs an explicit accessible label and should usually be replaced with Textarea.`);
    }
  }

  if (
    /<input\b[^>]*type=["'](?:radio|checkbox)["']/.test(content) &&
    !/<Fieldset\b/.test(content)
  ) {
    issues.push(`${relative}: Grouped radio and checkbox controls should be wrapped in Fieldset with Legend.`);
  }

  const rawButtons = content.match(/<button\b[^>]*>/g) ?? [];
  if (rawButtons.length > 0 && !/<form\b/.test(content)) {
    for (const tag of rawButtons) {
      if (!/\b(?:onClick|type|formAction|aria-controls|aria-expanded|disabled)\b/.test(tag)) {
        issues.push(`${relative}: Raw buttons outside forms need explicit action semantics.`);
        break;
      }
    }
  }

  const breadcrumbsOpenTag = content.match(/<Breadcrumbs\b[^>]*>/)?.[0];
  if (breadcrumbsOpenTag) {
    if (!/\baria-label=/.test(breadcrumbsOpenTag)) {
      issues.push(`${relative}: Breadcrumbs should declare an explicit aria-label.`);
    }

    const breadcrumbIndex = content.indexOf("<Breadcrumbs");
    const headingIndex = findFirstHeadingIndex(content);
    if (headingIndex !== -1 && breadcrumbIndex > headingIndex) {
      issues.push(`${relative}: Breadcrumbs should appear before the page heading.`);
    }

    const breadcrumbItemCount = (content.match(/<BreadcrumbsItem\b/g) ?? []).length;
    const breadcrumbLinkCount = (content.match(/<BreadcrumbsLink\b/g) ?? []).length;
    if (breadcrumbItemCount > 0 && breadcrumbItemCount === breadcrumbLinkCount) {
      issues.push(`${relative}: The current breadcrumb item should not be rendered as a link.`);
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

console.log(`Accessibility checks passed across ${tsxFiles.length} files in ${targets.length} target(s).`);

function resolveTargets(args) {
  return args.map((target) => {
    const resolved = path.resolve(repoRoot, target);
    if (!fs.existsSync(resolved)) {
      console.error(`Missing target: ${target}`);
      process.exit(1);
    }
    return resolved;
  });
}

function collectTargetFiles(targetPaths) {
  const files = new Set();

  for (const targetPath of targetPaths) {
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      collectFiles(targetPath, files);
      continue;
    }
    files.add(targetPath);
  }

  return [...files];
}

function collectFiles(directory, files) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
      continue;
    }
    files.add(fullPath);
  }
}

function findFirstHeadingIndex(content) {
  const headingPatterns = [/<Heading\b[^>]*level=\{1\}/, /<h1\b/];
  const indexes = headingPatterns
    .map((pattern) => content.search(pattern))
    .filter((index) => index !== -1);

  return indexes.length > 0 ? Math.min(...indexes) : -1;
}

function collectJsxOpeningTags(content, componentNames) {
  const escapedNames = componentNames
    .map((componentName) => componentName.replace(".", "\\."))
    .join("|");
  const pattern = new RegExp(`<(${escapedNames})\\b[^>]*>`, "g");
  const matches = [];

  for (const match of content.matchAll(pattern)) {
    matches.push({
      componentName: match[1],
      tag: match[0],
    });
  }

  return matches;
}
