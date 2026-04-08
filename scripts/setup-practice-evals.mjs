import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(repoRoot, "..");

const args = process.argv.slice(2);
const options = parseArgs(args);

const drillsRoot = path.resolve(
  repoRoot,
  options.drillsRoot ?? path.join("..", "interview-practice", "design-system-review", "broken"),
);
const outputRoot = path.resolve(
  repoRoot,
  options.outputRoot ?? path.join("..", ".agent-evals", "design-system-review"),
);
const force = options.force === "true";

if (!fs.existsSync(drillsRoot)) {
  console.error(`Missing drills root: ${drillsRoot}`);
  process.exit(1);
}

const requestedScenarios = options._;
const scenarios = requestedScenarios.length > 0 ? requestedScenarios : listScenarioDirectories(drillsRoot);

if (scenarios.length === 0) {
  console.error("No practice scenarios found.");
  process.exit(1);
}

fs.mkdirSync(outputRoot, { recursive: true });

for (const scenario of scenarios) {
  const sourceDir = path.join(drillsRoot, scenario);
  if (!fs.existsSync(sourceDir)) {
    console.error(`Missing scenario: ${scenario}`);
    process.exit(1);
  }

  const outputDir = path.join(outputRoot, scenario);
  if (fs.existsSync(outputDir)) {
    if (!force) {
      console.error(`Output already exists: ${outputDir}`);
      console.error("Re-run with --force=true to recreate it.");
      process.exit(1);
    }
    fs.rmSync(outputDir, { recursive: true, force: true });
  }

  copyDirectory(repoRoot, outputDir, new Set([".git", "node_modules", ".next", ".artifacts"]));
  linkNodeModules(outputDir);
  initializeGitRepository(outputDir);
  installScenario(sourceDir, outputDir, scenario);
}

console.log(`Prepared ${scenarios.length} practice eval repo(s) in ${path.relative(workspaceRoot, outputRoot)}.`);

function parseArgs(rawArgs) {
  const parsed = { _: [] };

  for (const arg of rawArgs) {
    if (!arg.startsWith("--")) {
      parsed._.push(arg);
      continue;
    }

    const [flag, value = "true"] = arg.slice(2).split("=");
    parsed[flag] = value;
  }

  return parsed;
}

function listScenarioDirectories(rootDir) {
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function copyDirectory(sourceDir, targetDir, excludedNames) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (excludedNames.has(entry.name)) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath, excludedNames);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

function linkNodeModules(outputDir) {
  const sourceNodeModules = path.join(repoRoot, "node_modules");
  if (!fs.existsSync(sourceNodeModules)) {
    return;
  }

  const targetNodeModules = path.join(outputDir, "node_modules");
  fs.symlinkSync(sourceNodeModules, targetNodeModules, "junction");
}

function installScenario(sourceDir, outputDir, scenarioName) {
  const componentPath = findScenarioComponent(sourceDir);
  const componentSource = fs.readFileSync(componentPath, "utf8");
  const componentName = readExportedComponentName(componentSource);
  const cssPath = findMatchingCssModule(sourceDir, componentPath);
  const componentBaseName = path.basename(componentPath, ".tsx");
  const appDir = path.join(outputDir, "src", "app");

  fs.copyFileSync(componentPath, path.join(appDir, `${componentBaseName}.tsx`));
  if (cssPath) {
    fs.copyFileSync(cssPath, path.join(appDir, path.basename(cssPath)));
  }

  fs.writeFileSync(
    path.join(appDir, "page.tsx"),
    `"use client";

import { ${componentName} } from "./${componentBaseName}";

export default function Page() {
  return <${componentName} />;
}
`,
    "utf8",
  );

  fs.writeFileSync(
    path.join(outputDir, "PRACTICE_EVAL.md"),
    `# Practice Eval

- Scenario: ${scenarioName}
- Source: ${sourceDir}
- Commands:
  - \`npm run check:designsystem -- src/app\`
  - \`npm run check:a11y -- src/app\`
  - \`npm run check:ai\`
`,
    "utf8",
  );
}

function findScenarioComponent(sourceDir) {
  const tsxFiles = fs
    .readdirSync(sourceDir)
    .filter((entry) => entry.endsWith(".tsx"))
    .sort();

  if (tsxFiles.length !== 1) {
    console.error(`Expected exactly one TSX component in ${sourceDir}.`);
    process.exit(1);
  }

  return path.join(sourceDir, tsxFiles[0]);
}

function findMatchingCssModule(sourceDir, componentPath) {
  const cssPath = path.join(sourceDir, `${path.basename(componentPath, ".tsx")}.module.css`);
  return fs.existsSync(cssPath) ? cssPath : null;
}

function initializeGitRepository(outputDir) {
  try {
    execFileSync("git", ["init", "-q"], { cwd: outputDir, stdio: "ignore" });
  } catch {
    console.error(`Failed to initialize git repository in ${outputDir}.`);
    process.exit(1);
  }
}

function readExportedComponentName(componentSource) {
  const match =
    componentSource.match(/export function (\w+)/) ??
    componentSource.match(/export const (\w+)\s*=/);

  if (!match) {
    console.error("Could not determine exported component name for practice scenario.");
    process.exit(1);
  }

  return match[1];
}
