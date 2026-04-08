# Codex Structure

This folder is reserved for Codex-specific project assets only.

## Source Of Truth

- `AGENTS.md`
  - Shared repo instructions across agents.
- `.agents/skills/`
  - Shared repo skills used directly by Codex and synced to other tools.
- `.agents/rules/`
  - Shared rule sources rendered into tool-specific outputs.
- `.codex/config.toml`
  - Codex project configuration.

## Guardrails

- Do not duplicate shared instructions into `.codex`.
- Do not create a separate Codex skill source unless the content is genuinely Codex-only.
- Treat the checked-in `AI_DESIGN_SYSTEM_GUIDE.md` as reference material, not as the only operational instruction surface.
