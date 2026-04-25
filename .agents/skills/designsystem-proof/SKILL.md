---
name: "designsystem-proof"
description: "Use when UI work needs evidence that it follows DesignSystemet usage, token rules, semantics, accessibility expectations, and browser behavior."
---

# DesignSystem Proof

Use this skill when a UI change needs evidence beyond source inspection.

## Goals

1. Prove the change uses `rk-designsystem` appropriately.
2. Prove token usage and layout structure are aligned with the template rules.
3. Prove the rendered result preserves semantic structure and accessibility-sensitive behavior.

## Default Flow

1. Run `npm run check:ai`.
2. Start the app locally.
3. Verify the changed view in a real browser with Chrome DevTools MCP.
4. Capture evidence for:
   - component usage
   - token usage
   - semantic structure
   - accessibility-sensitive states or interactions
   - changed internal links or navigation targets loading the intended UI
   - Chrome DevTools console/issues output for browser-only accessibility warnings
5. For new routes, changed forms, changed navigation, or substantial UI changes, write a short report under `.artifacts/designsystem-proof/`.

## Browser Evidence Checklist

- Record the route, viewport sizes, and user interactions verified.
- Use Chrome DevTools MCP snapshots for semantic structure: landmark count, top-level heading, accessible names, and interactive controls.
- Check Chrome DevTools console and Issues after the page loads and again after the key interactions.
- Exercise representative searches, filters, disclosures, buttons, form controls, and navigation introduced or changed by the work.
- For every new or changed internal link shown in the verified view, click it or otherwise prove its destination is valid.
- Capture at least one desktop and one mobile viewport when layout changed.

## Expectations

- Prefer browser captures over terminal-only proof for UI behavior.
- Form controls should have a stable `id`, `name`, and accessible name before browser verification.
- If Chrome DevTools reports a browser-only warning that static checks did not catch, treat it as proof evidence and either fix it or document why it is accepted.
- Mention any skipped checks explicitly.
- If verification surfaces a standards conflict, stop and surface it as a review point rather than expanding scope silently.
