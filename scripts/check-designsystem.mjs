import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const targetArgs = process.argv.slice(2);
const targets = resolveTargets(targetArgs.length > 0 ? targetArgs : ["src"]);

const issues = [];
const warnings = [];
const files = collectTargetFiles(targets).filter((file) => /\.(ts|tsx|css)$/.test(file));

for (const filePath of files) {
  const content = fs.readFileSync(filePath, "utf8");
  checkForbiddenPatterns(filePath, content);
  checkComponentOverrides(filePath, content);
  checkRawPrimitivePatterns(filePath, content);
  checkBrandPatterns(filePath, content);
}

if (warnings.length > 0) {
  console.warn("DesignSystem brand warnings (review, not blocking):\n");
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
  console.warn("");
}

if (issues.length > 0) {
  console.error("DesignSystem checks failed:\n");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`DesignSystem checks passed across ${files.length} files in ${targets.length} target(s).`);

function checkForbiddenPatterns(filePath, content) {
  const relative = path.relative(repoRoot, filePath);
  const forbiddenPatterns = [
    { pattern: /--ds-spacing-/, message: "Use --ds-size-* tokens instead of --ds-spacing-*." },
    { pattern: /var\(--spacing-/, message: "Use design tokens from the --ds-* namespace instead of spacing shortcuts." },
    { pattern: /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/, message: "Prefer design tokens over hardcoded hex colors." },
    { pattern: /\b(?:rgb|rgba|hsl|hsla)\(/, message: "Prefer design tokens over hardcoded color functions." },
    { pattern: /style=\{\{/, message: "Avoid inline styles in template source; prefer CSS Modules and design tokens." },
    { pattern: /\b(?:[1-9]\d*(?:\.\d+)?)px\b/, message: "Prefer design tokens and component props over hardcoded px values." },
  ];

  for (const { pattern, message } of forbiddenPatterns) {
    if (pattern.test(content)) {
      issues.push(`${relative}: ${message}`);
    }
  }
}

function checkComponentOverrides(filePath, content) {
  if (!content.includes("rk-designsystem")) {
    return;
  }

  const relative = path.relative(repoRoot, filePath);
  const styledComponentPattern =
    /<(Alert|Badge|Button|Card|CardBlock|Checkbox|Dialog|Footer|Header|Heading|Link|List(?:\.(?:Item|Ordered|Unordered))?|Paragraph|Radio|Select|Suggestion|Switch|Table|Tabs|Tag|Textfield|Textarea)\b[^>]*\b(className|style)=/g;

  if (styledComponentPattern.test(content)) {
    issues.push(`${relative}: Configure rk-designsystem components through props instead of className/style overrides.`);
  }
}

function checkRawPrimitivePatterns(filePath, content) {
  if (!filePath.endsWith(".tsx")) {
    return;
  }

  const relative = path.relative(repoRoot, filePath);

  if (/<button\b/.test(content)) {
    issues.push(`${relative}: Prefer the rk-designsystem Button component over raw <button> elements.`);
  }

  if (/<textarea\b/.test(content)) {
    issues.push(`${relative}: Prefer the rk-designsystem Textarea component over raw <textarea> elements.`);
  }

  if (/<input\b[^>]*type=["']radio["']/.test(content)) {
    issues.push(`${relative}: Prefer rk-designsystem Radio controls grouped with Fieldset and Legend.`);
  }

  if (/<input\b[^>]*type=["']checkbox["']/.test(content)) {
    issues.push(`${relative}: Prefer rk-designsystem Checkbox controls over raw checkbox inputs.`);
  }

  if (
    /<a\b(?=[^>]*href=["']\/[^"']*["'])(?=[^>]*className=)[^>]*>/.test(content) ||
    /<a\b(?=[^>]*className=)(?=[^>]*href=["']\/[^"']*["'])[^>]*>/.test(content)
  ) {
    issues.push(`${relative}: Prefer the rk-designsystem Link component for styled internal navigation links.`);
  }

  if (/<div\b[^>]*className=\{styles\.(?:card|panel|surface|tile)\}/.test(content)) {
    issues.push(`${relative}: Prefer rk-designsystem Card and CardBlock over custom card shells.`);
  }
}

function checkBrandPatterns(filePath, content) {
  const relative = path.relative(repoRoot, filePath);

  // Block emoji unicode in source. Targets pictographic blocks; preserves
  // Norwegian (æøå), typographic dashes, ™/®/©, and the brand «…» quotation marks.
  const emojiPattern =
    /[\u{1F300}-\u{1FAFF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
  if (emojiPattern.test(content)) {
    issues.push(
      `${relative}: Emoji unicode is not allowed (rk-brand-design BRAND.md). Remove the emoji or replace with an Aksel icon.`,
    );
  }

  // Warn (not block) when a Card paints a non-neutral surface for selection or
  // decoration. Brand pattern is neutral surface + 4px accent rail or "Valgt" Tag.
  const colouredCardPattern = /<Card\b[^>]*\bdata-color=["'](?!neutral["'])([a-z-]+)["']/g;
  let match;
  while ((match = colouredCardPattern.exec(content)) !== null) {
    const role = match[1];
    warnings.push(
      `${relative}: <Card data-color="${role}"> paints a non-neutral surface — review whether the entire card is intentionally a ${role} message, or use neutral + accent rail.`,
    );
  }
}

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
