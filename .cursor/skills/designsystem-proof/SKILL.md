---
name: "designsystem-proof"
description: "Capture proof that a contribution follows DesignSystemet usage, token rules, semantics, and accessibility expectations."
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
   - Chrome DevTools console/issues output for browser-only accessibility warnings
5. Write a short report under `.artifacts/designsystem-proof/` if the work is significant enough to need handoff evidence.

## Expectations

- Prefer browser captures over terminal-only proof for UI behavior.
- Form controls should have a stable `id`, `name`, and accessible name before browser verification.
- Mention any skipped checks explicitly.
- If verification surfaces a standards conflict, stop and surface it as a review point rather than expanding scope silently.
