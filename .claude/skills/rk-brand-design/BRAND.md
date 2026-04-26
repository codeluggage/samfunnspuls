# Brand voice and visual foundations — Røde Kors

Norges Røde Kors is the largest humanitarian volunteer organisation in Norway. The website (`rodekors.no`) and internal tools serve a very wide audience — first-time donors on mobile, volunteer coordinators on government PCs, people in crisis. The system optimises hard for **accessibility (WCAG AA+), keyboard navigation, plain Norwegian language, and zero surprise**. Red is *attention*, not decoration.

## Voice

**Language.** Bokmål Norwegian first, English second. Most copy is short, verb-first, instructional. Use **du/deg** (informal *you*). Never *man*. Never *Sie*-style formal. Public-facing copy stays at a level a 12-year-old reads easily; the goal is *unsurprising*, not clever.

**Tone.** Calm, direct, helpful. Røde Kors is humanitarian, so tone never strays into hype, exclamation marks, or marketing-speak. Headlines describe what the page *is*, not what it'll make you feel. Even errors are phrased as next steps, not blame.

**Casing.** Sentence case for headings ("Kom i gang", not "Kom I Gang"). Buttons are 1–3 words, verb-first, sentence case ("Lagre endringer", "Avbryt", "Send inn"). Never ALL-CAPS. Brand name is **Røde Kors** — two words, both capitalised, ø not o.

**I vs. you.** Always *you/du* speaking *to* the reader. Never *we/vi* unless quoting an organisational stance ("Vi i Røde Kors…" in editorial). Documentation uses imperative mood.

**Emoji?** No. The docs and component code do not use emoji. Iconography comes from `@navikt/aksel-icons` and the brand `CrossCorner` graphic.

**Examples** (real strings):
- *"Knappen er den mest grunnleggende interaktive komponenten."*
- *"Vær handlingsorientert: Knappeteksten bør være kort og beskrive handlingen."*
- *"Unngå `disabled`-knapper hvis mulig."*
- *"Tilgjengelighet, gjenbruk og konsistens."*
- *"Lagre endringer"*, *"Avbryt"*, *"Slett"*

**The vibe.** Public-service pragmatism with a humanitarian heart. Looks like a competent Nordic government site — wide white space, no gradients, generous typography, the red used sparingly and always meaningfully.

## Color discipline

- **Hero red `#D52B1E`** for the one primary action per view, the cross logo, important warnings — almost nowhere else.
- **Neutral palette** for everything structural.
- **Semantic info / success / warning / danger** only when the meaning *is* genuinely info/success/warning/danger.
- Every role ships **15 slots**: `background-default/tinted`, `surface-default/tinted/hover/active`, `border-subtle/default/strong`, `text-subtle/default`, `base-default/hover/active`, `base-contrast-subtle/default`.
- Both light and dark schemes are first-class via `data-color-scheme="light|dark|auto"`.

Switch the active role on any subtree with `data-color="primary-color-red|neutral|info|success|warning|danger|secondary-color-orange|secondary-color-rust|secondary-color-pink|additional-color-ocean|additional-color-jungle"`.

## Typography

- **Source Sans 3** at 18px base. The only family.
- Headings 500 (medium) at line-height 1.3; body 400 at 1.5.
- Geometric scale: 12 → 14 → 16 → 18 → 21 → 24 → 30 → 36 → 48 → 60px.
- Letter-spacing tightens negatively on display (`-0.01em` on 2xl/xl) and opens slightly at the smallest sizes.

## Spacing

- 4px unit on an 18px base, used through `--ds-size-1..30`.
- Most-used: 4, 8, 12, 16, 24, 32, 48, 60, 120 (sections).
- Touch targets never below 44px (`--ds-size-11`).
- **Hero sections pad 120px top/bottom** by default (`--ds-size-30`). For dashboard heroes that compete with content density, 88px (`--ds-size-22`) is acceptable; under 60px (`--ds-size-15`) breaks the brand feel.

## Backgrounds

- Mostly plain white.
- The **hero illustration** ships as a soft coral wave gradient (`assets/herosectionbg.png`) rendered at **18–20% opacity** behind centred content.
- Dark sections (`data-color-scheme="dark"`) flip the whole palette to charcoal `#181818` for value-prop strips.
- **No** glass-morphism, **no** full-bleed photo heroes by default, **no** repeating textures.

## Animation

- Two duration tokens dominate: **160ms** (`--ds-duration-fast`) for hover/focus, **260ms** (`--ds-duration-base`) for entrances and accordion.
- Easing is split: `--ds-ease-standard` (CSS Material standard) for state, `--ds-ease-emphasized` (`cubic-bezier(0.22, 1, 0.36, 1)`) for entrance/exit.
- Single canonical entrance keyframe is `fadeIn` — opacity 0→1 plus a 10px lift. **No** bounces, no spring physics, no parallax.

## Hover & active

- All interactive surfaces shift to a *darker* shade, never lighter.
- Buttons: `base-default → base-hover` (e.g. `#D52B1E → #b12419`).
- Surfaces: `surface-hover` (a deeper tint).
- Links: `info-base-hover`.
- Hover never changes opacity alone — that is the disabled state at 30%.
- Press / active goes one step further into the same direction (`base-active`, `surface-active`). **No scale transforms, no shrink** — just a deeper color.

## Borders & shadows

- Hairlines only — `1px` default, `3px` for focus rings.
- Subtle borders use the active role's `border-subtle` slot.
- Five-step elevation: `xs/sm/md/lg/xl`. All built from a 1px ambient + tight key + soft cast. Opacities run 0.16 / 0.12 / 0.10 — visible but never heavy.
- `xs` for resting cards, `sm` for hover, `md` for popovers, `lg` for dialogs, `xl` for the topmost overlay only.

## Layout

- Centred fixed-width: **1200px** for content pages, **1280px** for hero, **800px** for article columns.
- Header is fixed at the top with a generous skip-link.
- Section vertical rhythm: `--ds-size-30` (120px) for hero, `--ds-size-15` (60px) for sub-sections.
- **No** `backdrop-filter`. Dialog overlay uses a flat `rgba(0,0,0,0.4)` scrim, no blur.

## Imagery

- Photos: warm but real. Volunteers in red vests, real Norwegian outdoor light, no stock smiles.
- Hero illustration is a soft coral wave with halftones — friendly without being cute.
- No black-and-white photo treatment. No grain. No duotone.

## Corner radii

- Tight: 2 / 4 / 8 / 12 px (`--ds-border-radius-sm/md/lg/xl`).
- Default radius is **4px** — buttons, fields, cards.
- Larger radii (8 / 12) only on hero card images and bento blocks.
- Pills and avatars use `9999px`.
- **Cards** are: white surface + 1px subtle border + `xs` shadow + 4px radius. **No** colored accent stripe, **no** gradient borders. (Selection state on a card is a 4px red rail via `box-shadow inset` + a "Valgt" Tag — not a full surface paint.)

## CrossCorner

A signature decorative graphic (`<CrossCorner>` component): an L-shape clipped from the Red Cross plus sign, used in any of four corner orientations, in three sizes (48 / 68 / 96px), in any palette role.

- The most distinctive visual mark this system has after the logo itself.
- **Use sparingly.** One per section. Never more than two on a page.
- It is brand garnish, not iconography. Never use it for navigation or status.
- Pair with `aria-hidden`.

## Iconography

- Library: [`@navikt/aksel-icons`](https://aksel.nav.no/ikoner) — outline style, 1.5px stroke, 24×24 grid.
- Why Aksel: Norway's government services share this visual vocabulary (Skatteetaten, NAV, Helsenorge). A Røde Kors interface looks *familiar* alongside them.
- HTML mocks: use Lucide from CDN as a stand-in (also outline, 1.5px stroke). Production code must swap to `@navikt/aksel-icons`. This is a flagged substitution.

**Accessibility patterns:**
- Icon + visible text: `aria-hidden` on the icon (so screen readers do not announce "Trash Delete").
- Icon-only: `aria-label` on the *button*, icon stays `aria-hidden`. Pair with a `Tooltip`.

**Sizing.** Icons inherit `currentColor` and `fontSize` from parent. Recommended override is `fontSize: 1.25rem` (20px) inside default buttons. Spacing between icon and text is `var(--ds-spacing-1, 4px)`.

**Logo.** The Red Cross word-and-symbol mark — cross plus the wordmark "RØDE KORS" — ships as `assets/red-cross-logo.svg` and a wordmark variant `assets/logo-red-cross.svg`. **Never recolor the cross — `#D52B1E` is mandatory.**

## How to use this pack in a throwaway HTML mock

```html
<link rel="stylesheet" href="mocks/colors_and_type.css">
<header data-color="primary-color-red">
  <h1>Røde Kors</h1>
  <button style="background: var(--ds-color-base-default); color: var(--ds-color-base-contrast-default); padding: 12px 24px; border-radius: 4px; border: 0;">
    Bli frivillig
  </button>
</header>
```

Switch the active role on any subtree via `data-color="…"`.

## Caveats

- `mocks/colors_and_type.css` loads Source Sans 3 from Google Fonts. For self-hosted woff2 in production, Next.js's `Source_Sans_3` loader from `next/font/google` is the standard pattern.
- Icons are stubbed with Lucide CDN in mocks. Production code must use `@navikt/aksel-icons`.
- Dark mode tokens live in `tokens/theme.css` for completeness, but most rodekors.no surfaces are light by default with `data-color-scheme="dark"` reserved for value strips.
