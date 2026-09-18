# Mimi — design direction

Design Read: browser-extension companion UI (overlay + settings + future quiz) for a solo cybersecurity learner, dark utility-with-warmth visual language, dial ENERGY 2 / RHYTHM 2 / MOTION 2.

## Theme

Dark. Reason: matches the overlay already built, low-strain for long TryHackMe sessions, fits a dev/security-tool context.

## Personality

Companion warmth, not pure utilitarian. "Mimi" gets a bit of character (rounder corners, the accent color, slightly livelier motion), while staying visually quiet against whatever page it's overlaid on.

## Palette

| Token | Value | Reason |
|---|---|---|
| Background | `#1e1e1e` | Dark grey, deliberately not pure black — avoids the "purple-and-black" cliche |
| Text | `#f0f0f0` | High contrast against background |
| Border / secondary | `#3a3a3a` | Muted, for dividers and secondary UI, not decoration |
| Accent | `#9d7cf2` | Single flat violet, no gradient. Ties to the companion identity, distinct from generic dev-tool teal/blue |
| Error background | `#4a1616` | Dark red, same value already used in the overlay |
| Error text | `#f0a8a8` | Readable against the error background |
| Muted text | `#a8a8a8` | Secondary hierarchy for hints/subtitles. Neutral grey, doesn't count against the accent cap |

3 core neutrals + 1 accent + 1 semantic error color. Stays within a 2-3 core + 1 accent palette.

## Typography

`system-ui, sans-serif` stack. Base 14px, line-height 1.5. Reason: native, zero cost, matches the user's OS — no reason to import a webfont for a personal tool.

## Spacing & radius

Spacing scale: 4 / 8 / 12 / 16 / 24px.

Radius: 8px on panels (overlay, options page container), 6px on buttons and inputs. Deliberate variation, not everything pill-shaped.

## Motion (dial 2)

- Overlay entrance: one transition, fade + slight slide (~180ms ease-out). Single technique, not stacked.
- Buttons: subtle hover state (~120ms), one purpose (affordance feedback), one technique. Text buttons (options page, quiz page): border-color shifts to accent + `scale(1.02)`. Overlay icon buttons (28px): background tint only, no border and no scale — a bordered box around every small icon looked cluttered, and scaling a 16px glyph looked visually off (border/glyph growing out of proportion at that size). Background tint alone reads as clear feedback at that size without either.
- No motion beyond these two cases unless a new one earns its own written reason here.

## Component patterns

- **Floating overlay panel**: fixed position, background/text/border tokens above, 8px radius, box-shadow for elevation (single elevation level, not stacked with glow). Structured as a title row (menu/back toggle, label, close, non-scrolling), a toolbar row below it (action icons, non-scrolling), and a scrollable body region, overall panel capped at `min(70vh, 480px)` so it never exceeds the viewport regardless of content length. Exactly one divider line total, between title row and toolbar, not also between header and body — an earlier version had both and they sat close enough together (only when the toolbar was visible) to look cluttered/inconsistent with the menu and notes views, which only ever show one.
- **Toolbar icon grouping**: icons that do different things get a visual gap, not just a flat evenly-spaced row. The overlay's toolbar splits into an actions group (Save, Copy) and a zoom group (Zoom out, Zoom in), pushed apart with `justify-content: space-between` rather than one uniform `gap`. Grouping by purpose, not decoration, whitespace does the hierarchy work instead of a divider or label.
- **Loading state**: the overlay appears immediately on triggering Explain, before the Groq response arrives, showing "Explaining..." with just Close available. An antislop audit (`anti-slop/audit-001-2026-09-18.md`) flagged the earlier version, which showed nothing until the response landed, as a Hard Gate R-27 violation (missing loading state) and a likely source of the panel feeling unresponsive.
- **Identity accent**: the panel's label text ("Mimi" / "Menu" / "Notes") is always rendered in the accent color, the one place the accent shows up outside of hover. Same audit flagged that the accent was otherwise invisible at rest (only a hover tint), leaving the panel with no visible identity at a glance.
- **Title-row menu toggle**: a leading icon button that steps through a small navigation stack (explanation → menu → a menu item's own view), one level at a time — icon, label text, toolbar visibility, and body content all change together, instead of navigating to a separate page or jumping straight to a destination. E.g. panel-left icon + "Mimi" showing the explanation; clicking it opens a plain list menu ("Menu" + a "Notes" item); picking "Notes" goes one level deeper ("Notes" + the notes list). The icon becomes a back arrow the moment you're not on the explanation, and always steps back exactly one level. Keeps you in the same panel rather than pulling you out of what you're reading. Close stays independent of this toggle, always dismisses the whole panel from any level.
- **Buttons**: one style for every button, no primary/secondary split. Text buttons (options page, quiz page): transparent background, border token, fg-colored text, hover border-color accent + `scale(1.02)`. Replaces an earlier primary (solid accent background, white text) vs. ghost split: solid-accent white-on-`#9d7cf2` only measured 3.18:1 contrast, failing WCAG AA's 4.5:1 for text. Uniform style clears 14.63:1 everywhere and simplifies the system.
- **Icon buttons**: 28x28px, inline SVG copied verbatim from Lucide (lucide.dev, ISC license) per icon needed, no library/bundler dependency. No border (see Motion above), just the glyph plus a background-tint hover. Every icon button gets a `title` and `aria-label` matching its action (icons alone aren't accessible names). A completed/success action (Save, Copy) swaps its icon to a checkmark rather than relying on text, since there's no label to change.
- **Plain list buttons**: for menu items and list rows (the Menu view's "Notes" item, each note's topic toggle) — full-width, left-aligned text, no icon-button sizing/centering, otherwise inherits the same borderless/hover-tint/focus-outline treatment. Used where the content is a list of choices rather than a toolbar of actions.
- **Text input**: background token, border token, accent-colored focus outline (visible, not `outline: none`). All buttons and inputs also get a `title` tooltip even when they have visible text, for consistency and extra context on hover.

Every new feature (flashcard buttons, quiz page) styles against these tokens and patterns rather than re-deriving new ones. Any deviation gets its own one-line reason added here first.
