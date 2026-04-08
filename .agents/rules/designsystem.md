---
description: Follow DesignSystemet component, token, and semantic structure defaults.
globs: src/**/*.{ts,tsx,css}
alwaysApply: true
---

# DesignSystem Rules

- Prefer `rk-designsystem` components over custom HTML for common UI.
- Configure design system components through props before reaching for custom styling.
- Use CSS Modules for layout and composition. Do not restyle design system components through local overrides.
- Use `--ds-size-*` tokens for spacing and layout. Do not use `--ds-spacing-*`.
- Avoid hardcoded colors, shadows, and spacing values when an existing token covers the need.
- Keep pages semantic: use one clear `<main>`, a top-level heading, and accessible names for interactive controls.
- Treat the checked-in `AI_DESIGN_SYSTEM_GUIDE.md` and `metadata.json` as reference material that should support, not replace, code review and verification.
