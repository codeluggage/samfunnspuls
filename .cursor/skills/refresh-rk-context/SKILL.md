---
name: "refresh-rk-context"
description: "Refresh local DesignSystem context, regenerate tool-specific instruction assets, and report drift that needs engineer review."
---

# Refresh RK Context

Use this skill when the upstream DesignSystem guidance has changed and the template needs a controlled refresh.

## Inputs

- Upstream `AI_DESIGN_SYSTEM_GUIDE.md`
- Upstream `metadata.json`
- Upstream `ai-context.manifest.json`

## Default Flow

1. Refresh the checked-in upstream context artifacts.
2. Generate a drift report with:
   - safe refreshes
   - rule or policy conflicts
   - follow-up work candidates
   - issue-ready recommendations
3. Sync shared skills and rules into tool-specific outputs.
4. Stop if the refresh implies standards decisions instead of a straightforward context update.

## Commands

```bash
npm run guide:refresh
npm run guide:refresh -- --source=local --designsystem-root=../DesignSystem
```

## Guardrails

- Do not auto-clean application code as part of the refresh.
- Treat drift as reviewable information first.
- Preserve target-side tool customizations unless the engineer explicitly forces an overwrite.
