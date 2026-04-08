import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import os from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const force = args.has("--force");

const skillSourceDir = path.join(repoRoot, ".agents", "skills");
const ruleSourceDir = path.join(repoRoot, ".agents", "rules");

const targets = [
  {
    name: "claude",
    skillsDir: path.join(repoRoot, ".claude", "skills"),
    rulesDir: path.join(repoRoot, ".claude", "rules"),
    renderRule: renderClaudeRule,
    ruleExtension: ".md",
  },
  {
    name: "cursor",
    skillsDir: path.join(repoRoot, ".cursor", "skills"),
    rulesDir: path.join(repoRoot, ".cursor", "rules"),
    renderRule: renderCursorRule,
    ruleExtension: ".mdc",
  },
];

const issues = [];

main();

function main() {
  ensureDir(skillSourceDir);
  ensureDir(ruleSourceDir);

  const sourceSkills = listSkillDirs(skillSourceDir);
  const sourceRules = listRuleFiles(ruleSourceDir);

  for (const target of targets) {
    ensureDir(target.skillsDir);
    ensureDir(target.rulesDir);
    syncSkills(sourceSkills, target);
    syncRules(sourceRules, target);
  }

  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(issue);
    }
    process.exit(1);
  }

  console.log(checkOnly ? "Agent assets are in sync." : "Agent assets synced successfully.");
}

function syncSkills(sourceSkills, target) {
  const managedSkillNames = new Set(sourceSkills.map((skillPath) => path.basename(skillPath)));

  for (const sourceSkillPath of sourceSkills) {
    const skillName = path.basename(sourceSkillPath);
    const destinationDir = path.join(target.skillsDir, skillName);
    const sourceFiles = listRelativeFiles(sourceSkillPath);
    const targetExists = fs.existsSync(destinationDir);
    const managedMetaPath = path.join(destinationDir, ".agent-sync.json");

    if (targetExists) {
      for (const relativeFile of sourceFiles) {
        const sourceContent = read(path.join(sourceSkillPath, relativeFile));
        const targetPath = path.join(destinationDir, relativeFile);

        if (!fs.existsSync(targetPath)) {
          issues.push(`[${target.name}] Missing generated skill file: ${relativePath(targetPath)}`);
          continue;
        }

        const targetContent = read(targetPath);
        if (sourceContent !== targetContent) {
          reportDiff(relativePath(targetPath), sourceContent, targetContent, target.name);
          if (!force) {
            issues.push(
              `[${target.name}] Refusing to overwrite divergent skill file without --force: ${relativePath(targetPath)}`
            );
          }
        }
      }
    }

    if (checkOnly) {
      if (!targetExists) {
        issues.push(`[${target.name}] Missing generated skill directory: ${relativePath(destinationDir)}`);
      }
      continue;
    }

    if (!targetExists) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    if (force || !hasBlockingIssueFor(destinationDir, target.name)) {
      for (const relativeFile of sourceFiles) {
        const sourcePath = path.join(sourceSkillPath, relativeFile);
        const targetPath = path.join(destinationDir, relativeFile);
        ensureDir(path.dirname(targetPath));
        fs.copyFileSync(sourcePath, targetPath);
      }
      write(
        managedMetaPath,
        JSON.stringify(
          {
            generatedFrom: relativePath(sourceSkillPath),
            target: target.name,
          },
          null,
          2
        ) + "\n"
      );
    }
  }

  for (const entry of safeReaddir(target.skillsDir)) {
    const candidateDir = path.join(target.skillsDir, entry);
    const managedMetaPath = path.join(candidateDir, ".agent-sync.json");
    if (!fs.existsSync(managedMetaPath)) {
      continue;
    }
    if (managedSkillNames.has(entry)) {
      continue;
    }

    if (checkOnly) {
      issues.push(`[${target.name}] Stale generated skill directory: ${relativePath(candidateDir)}`);
      continue;
    }

    if (!force) {
      issues.push(`[${target.name}] Refusing to remove stale generated skill directory without --force: ${relativePath(candidateDir)}`);
      continue;
    }

    fs.rmSync(candidateDir, { recursive: true, force: false });
  }
}

function syncRules(sourceRules, target) {
  const managedRuleNames = new Set();

  for (const sourceRulePath of sourceRules) {
    const parsed = parseFrontmatter(read(sourceRulePath));
    const ruleName = path.basename(sourceRulePath, ".md");
    const destinationPath = path.join(target.rulesDir, `${ruleName}${target.ruleExtension}`);
    const rendered = target.renderRule({
      sourcePath: sourceRulePath,
      ruleName,
      ...parsed,
    });
    managedRuleNames.add(`${ruleName}${target.ruleExtension}`);

    if (fs.existsSync(destinationPath)) {
      const current = read(destinationPath);
      if (current !== rendered) {
        reportDiff(relativePath(destinationPath), rendered, current, target.name);
        if (!force) {
          issues.push(
            `[${target.name}] Refusing to overwrite divergent rule file without --force: ${relativePath(destinationPath)}`
          );
        }
      }
    } else if (checkOnly) {
      issues.push(`[${target.name}] Missing generated rule file: ${relativePath(destinationPath)}`);
    }

    if (checkOnly) {
      continue;
    }

    if (!fs.existsSync(destinationPath) || force || !hasBlockingIssueFor(destinationPath, target.name)) {
      write(destinationPath, rendered);
    }
  }

  for (const entry of safeReaddir(target.rulesDir)) {
    const candidate = path.join(target.rulesDir, entry);
    if (!fs.statSync(candidate).isFile()) {
      continue;
    }
    if (!entry.includes(".md")) {
      continue;
    }
    const current = read(candidate);
    if (!current.includes("GENERATED FROM .agents/rules/")) {
      continue;
    }
    if (managedRuleNames.has(entry)) {
      continue;
    }

    if (checkOnly) {
      issues.push(`[${target.name}] Stale generated rule file: ${relativePath(candidate)}`);
      continue;
    }

    if (!force) {
      issues.push(`[${target.name}] Refusing to remove stale generated rule file without --force: ${relativePath(candidate)}`);
      continue;
    }

    fs.rmSync(candidate, { force: false });
  }
}

function renderClaudeRule({ sourcePath, body }) {
  return `<!-- GENERATED FROM ${relativePath(sourcePath)}. DO NOT EDIT DIRECTLY. -->\n\n${body.trim()}\n`;
}

function renderCursorRule({ sourcePath, description, globs, alwaysApply, body }) {
  return `---\ndescription: ${description}\nglobs: ${globs}\nalwaysApply: ${alwaysApply}\n---\n\n<!-- GENERATED FROM ${relativePath(
    sourcePath
  )}. DO NOT EDIT DIRECTLY. -->\n\n${body.trim()}\n`;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error("Rule source is missing frontmatter.");
  }

  const frontmatter = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    frontmatter[key] = value;
  }

  return {
    description: frontmatter.description ?? "Generated rule",
    globs: frontmatter.globs ?? "**/*",
    alwaysApply: frontmatter.alwaysApply ?? "true",
    body: match[2],
  };
}

function listSkillDirs(directory) {
  return safeReaddir(directory)
    .map((entry) => path.join(directory, entry))
    .filter((candidate) => fs.statSync(candidate).isDirectory())
    .filter((candidate) => fs.existsSync(path.join(candidate, "SKILL.md")));
}

function listRuleFiles(directory) {
  return safeReaddir(directory)
    .map((entry) => path.join(directory, entry))
    .filter((candidate) => fs.statSync(candidate).isFile())
    .filter((candidate) => candidate.endsWith(".md"));
}

function listRelativeFiles(directory) {
  const files = [];
  walk(directory, directory, files);
  return files.filter((file) => file !== ".agent-sync.json");
}

function walk(root, directory, files) {
  for (const entry of safeReaddir(directory)) {
    const fullPath = path.join(directory, entry);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      walk(root, fullPath, files);
      continue;
    }
    files.push(path.relative(root, fullPath));
  }
}

function reportDiff(targetPath, expected, actual, targetName) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-sync-"));
  const expectedPath = path.join(tempDir, "expected");
  const actualPath = path.join(tempDir, "actual");
  fs.writeFileSync(expectedPath, expected, "utf8");
  fs.writeFileSync(actualPath, actual, "utf8");

  const diff = spawnSync("git", ["--no-pager", "diff", "--no-index", "--", expectedPath, actualPath], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  console.error(`[${targetName}] Diff required review for ${targetPath}`);
  if (diff.stdout) {
    console.error(diff.stdout.trim());
  }

  fs.rmSync(tempDir, { recursive: true, force: true });
}

function hasBlockingIssueFor(targetPath, targetName) {
  return issues.some(
    (issue) => issue.includes(`[${targetName}]`) && issue.includes(relativePath(targetPath))
  );
}

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function safeReaddir(directory) {
  return fs.existsSync(directory) ? fs.readdirSync(directory) : [];
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function write(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function relativePath(filePath) {
  return path.relative(repoRoot, filePath) || ".";
}
