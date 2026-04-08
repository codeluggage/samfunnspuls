# Next.js Designsystemet Template

Next.js starter template pre-configured with the [Røde Kors Design System](https://norwegianredcross.github.io/DesignSystem/storybook/).

## What's included

- **Next.js 16** (App Router, TypeScript, webpack)
- **React Compiler** enabled
- **rk-designsystem** — Røde Kors component library
- **Design tokens** — Røde Kors theme (colors, spacing, typography)
- **Source Sans 3** font via `next/font`
- **Devcontainer** — open in VS Code and start coding immediately
- **AI_DESIGN_SYSTEM_GUIDE.md** — reference guide for AI-assisted development
- **Repo-scoped skills and rules** — shared agent context with guarded propagation to Claude and Cursor

## Getting started

### With devcontainer (recommended)

1. Clone this repo
2. Open in VS Code
3. Click "Reopen in Container" when prompted
4. Run `npm run dev`
5. Open http://localhost:3000

### Without devcontainer

```bash
npm install
npm run dev
```

## Important notes

- **Do not** add `padding: 0` or `margin: 0` to `globals.css` — this breaks the design system components
- Use design tokens (`var(--ds-size-*)`, `var(--ds-color-*)`) instead of hardcoded values
- Use design system components (`<Button>`, `<Card>`, `<Heading>`, etc.) instead of custom HTML
- Pages using design system components need the `"use client"` directive

## Collaboration workflow

### Shared instruction layers

- `AGENTS.md` is the cross-agent source of truth
- `.agents/skills` is the shared skill source
- `.agents/rules` is the shared rule source for generated Claude and Cursor rules
- `AI_DESIGN_SYSTEM_GUIDE.md` remains the checked-in reference guide

### Core commands

```bash
npm run skills:sync
npm run check:ai
npm run guide:refresh
```

### Refreshing upstream context

Refresh the local guide, metadata, and upstream manifest from published artifacts:

```bash
npm run guide:refresh
```

Or refresh from a local sibling checkout of `DesignSystem`:

```bash
npm run guide:refresh -- --source=local --designsystem-root=../DesignSystem
```

The refresh flow writes a drift report to `.artifacts/refresh-rk-context/latest.md` and stops when policy conflicts or tool-specific divergence need review.

`npm run check:ai` also includes a production build so route-level or render-time issues fail early instead of slipping past static checks.

## Resources

- [Storybook](https://norwegianredcross.github.io/DesignSystem/storybook/) — component explorer
- [Design Tokens CSS](https://norwegianredcross.github.io/design-tokens/theme.css) — all available tokens
- [AI_DESIGN_SYSTEM_GUIDE.md](./AI_DESIGN_SYSTEM_GUIDE.md) — full setup and usage guide
- [metadata.json](./metadata.json) — local copy of upstream component metadata after refresh
