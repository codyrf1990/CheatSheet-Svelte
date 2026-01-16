# SolidCAM CheatSheet - UI Polish Spec (Triple-A)

## Purpose

Deliver a "triple-A" polish pass across the existing app without adding new features. The goal is a premium, fun, fast experience that feels cohesive and dependable for estimate building.

## AI Agent Handoff Summary

This document is intended for an AI coding agent. Scope is strictly polish and consistency, not new features or workflows. Preserve existing behavior and data flows.

### Non-Negotiables

- Do not add new features or change business logic.
- Keep all existing workflows intact (companies/pages, packages, panels, sync).
- Prioritize visual consistency, interaction polish, and clarity.
- Ensure mobile remains usable with compact layouts.

### High-Risk Areas (Avoid Breaking)

- Company/page system and sync state (`src/lib/stores/companies.svelte.ts`, `src/lib/stores/sync.svelte.ts`).
- Package selection logic (`src/lib/stores/packages.svelte.ts` + `src/lib/components/packages/*`).
- Panels and maintenance SKUs (`src/lib/stores/panels.svelte.ts`, `src/lib/components/panels/*`).

### Primary Surfaces to Polish

- Layout shell and density: `src/routes/+layout.svelte`, `src/routes/+page.svelte`.
- Global tokens and base styles: `src/app.css`.
- UI primitives: `src/lib/components/ui/*` (Button, Input, Checkbox, Modal, Toast).
- Header + Company/Page bar: `src/lib/components/layout/*`.
- Package table and rows: `src/lib/components/packages/*`.
- Panels and calculator: `src/lib/components/panels/*`, `src/lib/components/calculator/*`.

## Audience

Internal team (coworkers) using the app to build estimates. Secondary audience: support/maintainers.

## Scope (In)

- Visual consistency: spacing, typography, color usage, component alignment.
- Interaction feel: hover/press/focus states, transitions, and responsiveness.
- Clarity improvements: labels, empty states, subtle helper text where needed.
- Error/sync messaging: best-practice handling with minimal user friction.
- Mobile usability: compact, readable, and fully usable on smaller screens.

## Out of Scope

- New features, new data models, or new workflows.
- Major layout re-architecture.
- Authentication system changes.

## Design Intent (3 Adjectives)

Premium, fun, fast.

## UI Quality Bar (Definition of Triple-A)

- Looks premium and cohesive across all screens.
- Feels fast and predictable under normal usage.
- No rough edges, broken states, or mismatched behaviors.

## Core UX Principles

- Consistency first: same patterns everywhere for menus, buttons, inputs, tabs.
- Immediate feedback: every action yields a clear visual response.
- Minimal friction: avoid interruptions, keep flow intact.
- High-density clarity: lots of info without visual noise.
- Accessible by default: keyboard, focus, and contrast are first-class.

## Functional Requirements

### 1) Visual Consistency

- Spacing follows a clear rhythm (no random margins/paddings).
- Typography hierarchy is consistent across headers, tables, panels, and modals.
- Color usage is intentional: brand accents only for emphasis.
- Icons match in size, stroke weight, and alignment.

### 2) Interaction Feel

- Buttons, links, and menu items share a consistent hover/press/focus behavior.
- Dropdowns and modals open/close smoothly and predictably.
- Drag-drop states are visually clear (when enabled).
- Copy-to-clipboard actions show feedback quickly and consistently.

### 3) Clarity & Readability

- Labels are short and obvious to coworkers.
- Empty states or non-configured states are not silent.
- Text is readable at smallest supported viewport.
- Info density does not reduce legibility.

### 4) Error & Sync Handling (Best Practice)

- Sync status is always visible and unambiguous.
- Errors never discard local changes.
- Automatic retry is allowed, but never blocks the user.
- Manual "Sync Now" remains possible when issues occur.
- Errors show a plain-language message and a recovery action.

### 5) Mobile Usability

- App remains usable on small screens with compact spacing.
- Critical actions remain visible (no hidden primary actions).
- Touch targets remain usable even when compact.

## Acceptance Criteria (Must Pass)

- UI visual consistency: no conflicting spacing scales or mismatched typography.
- All interactive elements have visible focus states.
- Dropdowns and modals always appear above content and never clip.
- Copy actions confirm success or failure within 1 second.
- Sync failures never overwrite or lose local data.
- Mobile viewport works without breaking layout or hiding critical actions.

## Quality Checklist (QA)

- Navigation: tabs, menus, and dropdowns behave the same across the app.
- Typography: consistent sizes for headings, body, labels, and data values.
- Color: contrast meets accessibility minimums for small text.
- Motion: reduced-motion users see no critical animations.
- Responsiveness: no overlapping or clipped content at narrow widths.
- Error states: clear, non-technical, with a recovery path.

## Notes for Implementation

- Avoid new UI patterns unless they are replacing an existing one.
- Where possible, consolidate styles into shared patterns rather than one-off CSS.
- Any change should preserve current workflows and data behavior.

## AI Agent Execution Notes

- Prefer small, surgical edits; avoid large refactors.
- Keep animations consistent and subtle; honor reduced-motion users.
- Ensure focus-visible states are preserved everywhere.
- If you need to touch layout rules, verify narrow viewports (900px, 768px, 640px, 500px) remain usable.

## Suggested Triple-A Polish Opportunities (Non-Feature)

- Consistent dropdown/menu behavior and positioning across header and company bar (visual + interaction parity). Primary refs: `src/routes/+page.svelte`, `src/lib/components/layout/CompanyPageBar.svelte`.
- Replace `prompt`/`confirm` usage with existing modal patterns for a premium feel and consistent UX (no workflow changes). Primary refs: `src/lib/components/layout/CompanyPageBar.svelte`, `src/lib/components/panels/MaintenancePanel.svelte`, `src/lib/components/panels/EditablePanel.svelte`.
- Unify spacing/typography tokens across table headers, panel headers, and pills to reduce “almost‑the‑same” sizes. Primary refs: `src/app.css`, `src/lib/components/packages/PackageTable.svelte`, `src/lib/components/panels/PanelItem.svelte`.
- Ensure all interactive elements share the same focus/hover/pressed language (buttons, tabs, dropdown items). Primary refs: `src/lib/components/ui/Button.svelte`, `src/lib/components/layout/Header.svelte`, `src/lib/components/ui/Modal.svelte`.
- Tighten empty-state messaging for clarity where lists can be empty (companies/pages/panels). Primary refs: `src/lib/components/layout/CompanyPageBar.svelte`, `src/lib/components/panels/EditablePanel.svelte`.
- Validate reduced-motion fallbacks for animated elements (drop-downs, toasts, any shimmer/glow). Primary refs: `src/routes/+page.svelte`, `src/lib/components/ui/ToastContainer.svelte`.
- Ensure panel/package selections persist cleanly across page switches and reloads (quality polish, no new workflow). Primary refs: `src/routes/+page.svelte`, `src/lib/stores/companies.svelte.ts`, `src/lib/stores/packages.svelte.ts`, `src/lib/stores/panels.svelte.ts`.

## Open Questions

- Any internal naming conventions that must be preserved in labels?
- Are there known UI pain points that should be prioritized first?
