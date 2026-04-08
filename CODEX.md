# Codex Repo Notes

This file documents the Codex-specific structure for this repository. It is not the runtime source of truth for shared instructions.

## Source Of Truth

- `AGENTS.md`
  - Cross-agent repo instructions.
- `.agents/skills/`
  - Shared repo skill source of truth.
- `.agents/rules/`
  - Shared rule source material for tool-specific rule generation.
- `.codex/config.toml`
  - Project-scoped Codex configuration.

## Non-Goals

- Do not duplicate `AGENTS.md` into Codex-specific files.
- Do not add a separate `.codex/skills` tree. Codex reads shared repo skills from `.agents/skills`.
- Keep Codex-specific configuration light unless a real Codex-only need emerges.
