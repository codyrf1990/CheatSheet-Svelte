# Cloud Sync Plan (Choice A: Sync userPrefs)

## Scope

This plan syncs **userPrefs** to cloud so ordering and custom bits/items persist **per user** across devices. It extends existing page/company sync without changing its structure.

## Deep Research Findings (Current Storage Map)

### Cloud (Firestore)

- `src/lib/firebase/sync.ts` writes to collection `users/{normalizedUsername}`.
- Stored fields today: `username`, `normalizedUsername`, `schemaVersion`, `updatedAt`, `pageSystem`, `client`.
- `pageSystem` comes from `companiesStore.exportData()` and includes companies/pages/panels/packages selection state (plus licenses).

### Local storage (browser only)

- `solidcam-companies`, `solidcam-current-company-id`, `solidcam-favorites`, `solidcam-recent`
  - Source: `src/lib/stores/companies.svelte.ts`
- `solidcam-user-prefs`
  - Source: `src/lib/stores/userPrefs.svelte.ts`
  - Contains:
    - `customPanelItems`
    - `customPackageBits`
    - `backgroundVideoPaused` (device preference)
    - `packageBitOrders` (bit order)
    - `packageLooseBitOrders` (loose bit order)
    - `packageGroupMembership` (bit -> group)
- `solidcam-sync-username`, `solidcam-remember-me`, `solidcam-last-username`
  - Source: `src/lib/stores/sync.svelte.ts`

### Where order is stored (important)

- Bit order is **global** and stored only in `userPrefsStore` (`solidcam-user-prefs`).
  - `src/lib/stores/packages.svelte.ts` uses `userPrefsStore.getPackageBitOrder()` and `getPackageLooseBitOrder()`.
- When saving page state, package order is intentionally **not** stored:
  - `src/lib/stores/packages.svelte.ts` -> `getPageState()` sets `order: []` and `looseBitsOrder: []`.

### Why order currently resets across devices

- Cloud sync only includes `pageSystem`, not `userPrefs`.
- So per-user ordering never leaves the device/browser.

## What Should Be Stored in Cloud (Recommended)

### Should be in cloud (per-user, cross-device)

- `companies` / `pages` / `page state` (already)
- `licenses` inside company data (already)
- `favorites`, `recents` (already)
- **userPrefs**:
  - `customPanelItems`
  - `customPackageBits`
  - `packageBitOrders`
  - `packageLooseBitOrders`
  - `packageGroupMembership`

### Should remain local (per-device)

- `rememberMe`, `lastUsername` (device convenience)
- `backgroundVideoPaused` (device preference; exclude from cloud unless you want per-user video state)
- UI-only toggles: edit mode, remove mode, dropdown open states, etc.

## Plan (1-20)

1. Confirm goal: persist **ordering** and **custom bits/items** **per user** across devices.
2. Update app init order so `userPrefsStore.init()` runs **before** `syncStore.load()` to avoid clobbering prefs.
3. Define a `userPrefs` payload for cloud; **exclude** `backgroundVideoPaused` by default.
4. Add `userPrefsSchemaVersion` (or reuse existing `schemaVersion`) for future migration.
5. Extend `CloudUserData` type to include `userPrefs`, `userPrefsUpdatedAt`, and align `pageSystem` typing with `companiesStore.exportData()`.
6. Update Firestore read/write in `src/lib/firebase/sync.ts` to include `userPrefs`.
7. Decide conflict strategy: "newer wins" using timestamps for **pageSystem** and **userPrefs** (separate clocks).
8. Add `userPrefsUpdatedAt` in `userPrefsStore` and bump it on any pref mutation.
9. Add `userPrefsStore.exportData()` / `importData()` to serialize/validate cloud payload (guard invalid).
10. Wire `userPrefsStore` changes into `syncStore` (change handler or explicit sync trigger).
11. Update `syncStore.connect()` to merge cloud/local `userPrefs` based on `userPrefsUpdatedAt`.
12. Update `syncStore.handleDataChange()` to include `userPrefs` in queued saves.
13. Add one-time migration: if cloud has no `userPrefs`, upload local.
14. Decide **Reset Order** semantics: per-user (cloud) vs per-device (local only); update UI copy.
15. Add regression checks:
    - reorder bits → refresh → persists
    - reorder bits → sign in on another device → persists
    - prefs-only change doesn’t overwrite newer pageSystem
16. Verify no PII or sensitive data added to cloud payload.
17. Ensure Firestore rules allow read/write of `userPrefs` under the user's doc.
18. Add doc note about Firestore document size limits (licenses + prefs growth).
19. Update documentation: what's synced vs device-only.
20. Ship and monitor (logs for prefs sync failures).

## Open Questions

- Should `customPanelItems` and `customPackageBits` sync? (Default: yes)
- Do we need separate timestamps for `pageSystem` vs `userPrefs`? (Default: yes)
- Should "Reset Order" reset **cloud** (all devices) or just local?

## Proposed Cloud Payload Shape (example)

```
{
  username,
  normalizedUsername,
  schemaVersion,
  updatedAt,
  pageSystem: { ... }, // full companiesStore.exportData() payload
  userPrefs: {
    customPanelItems,
    customPackageBits,
    packageBitOrders,
    packageLooseBitOrders,
    packageGroupMembership
  },
  userPrefsUpdatedAt
}
```
