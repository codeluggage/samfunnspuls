import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const defaultLocalDesignSystemRoot = path.resolve(repoRoot, "..", "DesignSystem");
const args = parseArgs(process.argv.slice(2));
const sourceMode = args.source ?? "remote";
const designSystemRoot = path.resolve(args["designsystem-root"] ?? defaultLocalDesignSystemRoot);
const artifactDir = path.join(repoRoot, ".artifacts", "refresh-rk-context");

const remoteBase = "https://norwegianredcross.github.io/DesignSystem/storybook";
const targets = [
  {
    name: "AI_DESIGN_SYSTEM_GUIDE.md",
    targetPath: path.join(repoRoot, "AI_DESIGN_SYSTEM_GUIDE.md"),
    localPath: path.join(designSystemRoot, "AI_DESIGN_SYSTEM_GUIDE.md"),
    remoteUrl: `${remoteBase}/AI_DESIGN_SYSTEM_GUIDE.md`,
  },
  {
    name: "metadata.json",
    targetPath: path.join(repoRoot, "metadata.json"),
    localPath: path.join(designSystemRoot, "metadata.json"),
    remoteUrl: `${remoteBase}/metadata.json`,
  },
  {
    name: "ai-context.manifest.json",
    targetPath: path.join(repoRoot, ".agents", "context", "upstream", "ai-context.manifest.json"),
    localPath: path.join(designSystemRoot, "ai-context.manifest.json"),
    remoteUrl: `${remoteBase}/ai-context.manifest.json`,
  },
];

const report = {
  safeRefreshes: [],
  decisionPoints: [],
  followUpWork: [],
  issueCandidates: [],
};

await main();

async function main() {
  fs.mkdirSync(artifactDir, { recursive: true });

  for (const target of targets) {
    const previous = fs.existsSync(target.targetPath) ? fs.readFileSync(target.targetPath, "utf8") : null;
    const next = await loadContent(target);
    const changed = previous !== next;

    write(target.targetPath, next);

    if (changed) {
      report.safeRefreshes.push(`${target.name} refreshed from ${sourceMode === "local" ? relativeToRepo(target.localPath) : target.remoteUrl}`);
    } else {
      report.safeRefreshes.push(`${target.name} already matched the selected source.`);
    }
  }

  mirrorBrandTokens();

  const guide = fs.readFileSync(path.join(repoRoot, "AI_DESIGN_SYSTEM_GUIDE.md"), "utf8");
  const manifest = JSON.parse(
    fs.readFileSync(path.join(repoRoot, ".agents", "context", "upstream", "ai-context.manifest.json"), "utf8")
  );

  analyzeGuide(guide);
  analyzeManifest(manifest);

  const syncResult = spawnSync("node", ["scripts/sync-agent-assets.mjs"], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (syncResult.stdout) {
    report.safeRefreshes.push(syncResult.stdout.trim());
  }
  if (syncResult.status !== 0) {
    report.decisionPoints.push("Tool-specific generated assets diverged from shared sources and were not overwritten automatically.");
    if (syncResult.stderr) {
      report.followUpWork.push(syncResult.stderr.trim());
    }
  }

  const reportPath = path.join(artifactDir, "latest.md");
  write(reportPath, renderReport());
  console.log(`Refresh report written to ${relativeToRepo(reportPath)}`);

  if (report.decisionPoints.length > 0) {
    console.error("Refresh surfaced review points. Inspect the drift report before continuing.");
    process.exit(1);
  }

  console.log("Refresh completed without blocking drift.");
}

function mirrorBrandTokens() {
  const brandSkillTokens = path.join(
    repoRoot,
    ".agents",
    "skills",
    "rk-brand-design",
    "tokens",
    "theme.css",
  );
  const installedThemePath = path.join(
    repoRoot,
    "node_modules",
    "rk-design-tokens",
    "design-tokens-build",
    "theme.css",
  );

  if (!fs.existsSync(installedThemePath)) {
    report.followUpWork.push(
      "rk-design-tokens is not installed in node_modules — skipping the rk-brand-design tokens mirror.",
    );
    return;
  }

  if (!fs.existsSync(path.dirname(brandSkillTokens))) {
    // Skill not present in this project — nothing to mirror.
    return;
  }

  const installed = fs.readFileSync(installedThemePath, "utf8");
  const previous = fs.existsSync(brandSkillTokens) ? fs.readFileSync(brandSkillTokens, "utf8") : null;

  if (previous === installed) {
    report.safeRefreshes.push("rk-brand-design tokens/theme.css already matched the installed rk-design-tokens.");
    return;
  }

  write(brandSkillTokens, installed);
  report.safeRefreshes.push(
    `rk-brand-design tokens/theme.css mirrored from ${relativeToRepo(installedThemePath)}.`,
  );
  report.followUpWork.push(
    "rk-brand-design mocks/colors_and_type.css is hand-curated and was NOT regenerated — review whether the curated subset still matches the new theme.",
  );
}

function analyzeGuide(guide) {
  const driftPatterns = [
    {
      pattern: /var\(--ds-spacing-/g,
      message: "Guide still uses var(--ds-spacing-*) examples even though template rules require --ds-size-* tokens.",
    },
    {
      pattern: /var\(--spacing-/g,
      message: "Guide still references spacing shortcuts outside the --ds-* token namespace.",
    },
  ];

  for (const { pattern, message } of driftPatterns) {
    if (pattern.test(guide)) {
      report.decisionPoints.push(message);
      report.issueCandidates.push(`Review upstream guide terminology drift: ${message}`);
    }
  }
}

function analyzeManifest(manifest) {
  if (!Array.isArray(manifest.driftSignals) || manifest.driftSignals.length === 0) {
    report.decisionPoints.push("Upstream ai-context.manifest.json is missing drift signals required by the refresh workflow.");
    return;
  }

  if (Array.isArray(manifest.guideDiagnostics)) {
    for (const diagnostic of manifest.guideDiagnostics) {
      const message = `Upstream guide diagnostic: ${diagnostic.message}`;

      if (diagnostic.severity === "error") {
        report.decisionPoints.push(message);
      } else {
        report.followUpWork.push(message);
      }

      report.issueCandidates.push(`Investigate upstream guide diagnostic: ${diagnostic.message}`);
    }
  }

  report.followUpWork.push(
    "A second pass focused on stronger accessibility-agent patterns and team feedback would be valuable after this workflow has been used in practice."
  );
}

function renderReport() {
  const lines = [
    "# Refresh RK Context Report",
    "",
    `- Source mode: ${sourceMode}`,
    `- DesignSystem root: ${designSystemRoot}`,
    "",
    "## Safe Refreshes",
    "",
    ...toBullets(report.safeRefreshes),
    "",
    "## Decision Points",
    "",
    ...toBullets(report.decisionPoints),
    "",
    "## Follow-Up Work",
    "",
    ...toBullets(report.followUpWork),
    "",
    "## Issue Candidates",
    "",
    ...toBullets(report.issueCandidates),
    "",
  ];

  return lines.join("\n");
}

async function loadContent(target) {
  if (sourceMode === "local") {
    return fs.readFileSync(target.localPath, "utf8");
  }

  const response = await fetch(target.remoteUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${target.remoteUrl}: ${response.status} ${response.statusText}`);
  }
  return await response.text();
}

function parseArgs(argv) {
  const parsed = {};
  for (const argument of argv) {
    if (!argument.startsWith("--")) {
      continue;
    }
    const [key, value] = argument.slice(2).split("=");
    parsed[key] = value ?? true;
  }
  return parsed;
}

function toBullets(items) {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ["- None"];
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function relativeToRepo(filePath) {
  return path.relative(repoRoot, filePath) || ".";
}
