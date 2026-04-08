import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(repoRoot, "src");

const issues = [];
const files = collectFiles(srcRoot).filter((file) => /\.(ts|tsx|css)$/.test(file));

for (const filePath of files) {
  const content = fs.readFileSync(filePath, "utf8");
  checkForbiddenPatterns(filePath, content);
  checkComponentOverrides(filePath, content);
}

if (issues.length > 0) {
  console.error("DesignSystem checks failed:\n");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`DesignSystem checks passed across ${files.length} files.`);

function checkForbiddenPatterns(filePath, content) {
  const relative = path.relative(repoRoot, filePath);
  const forbiddenPatterns = [
    { pattern: /--ds-spacing-/g, message: "Use --ds-size-* tokens instead of --ds-spacing-*." },
    { pattern: /var\(--spacing-/g, message: "Use design tokens from the --ds-* namespace instead of spacing shortcuts." },
    { pattern: /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g, message: "Prefer design tokens over hardcoded hex colors." },
    { pattern: /\b(?:rgb|rgba|hsl|hsla)\(/g, message: "Prefer design tokens over hardcoded color functions." },
    { pattern: /style=\{\{/g, message: "Avoid inline styles in template source; prefer CSS Modules and design tokens." },
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
