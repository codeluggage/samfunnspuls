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

## Resources

- [Storybook](https://norwegianredcross.github.io/DesignSystem/storybook/) — component explorer
- [Design Tokens CSS](https://norwegianredcross.github.io/design-tokens/theme.css) — all available tokens
- [AI_DESIGN_SYSTEM_GUIDE.md](./AI_DESIGN_SYSTEM_GUIDE.md) — full setup and usage guide
