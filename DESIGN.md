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
- Buttons: subtle hover state, border-color shifts to accent + background tint (~120ms). One purpose (affordance feedback), one technique. Text buttons additionally get `scale(1.02)`. Icon buttons (28px) skip the scale, scaling a small icon glyph looked visually off (border/glyph growing out of proportion at that size), border-color + background tint alone reads as clear feedback without it.
- No motion beyond these two cases unless a new one earns its own written reason here.

## Component patterns

- **Floating overlay panel**: fixed position, background/text/border tokens above, 8px radius, box-shadow for elevation (single elevation level, not stacked with glow). Structured as a title row (menu/back toggle, label, close, non-scrolling), a toolbar row below it (action icons, non-scrolling), and a scrollable body region, overall panel capped at `min(70vh, 480px)` so it never exceeds the viewport regardless of content length.
- **Title-row menu toggle**: a leading icon button that swaps between two states (icon, label text, and body content all change together) instead of navigating to a separate page — e.g. hamburger + "Mimi" showing the explanation, or back-arrow + "Notes" showing a list view, in the same panel. Keeps you in place rather than pulling you out of what you're reading. Close stays independent of this toggle, always dismisses the whole panel from either state.
- **Buttons**: one style for every button, no primary/secondary split — transparent background, border token, fg-colored text/icon, hover border-color accent + `scale(1.02)`. Replaces the earlier primary (solid accent background, white text/icon) vs. ghost split: solid-accent white-on-`#9d7cf2` only measured 3.18:1 contrast, failing WCAG AA's 4.5:1 for text (icons alone would've cleared the 3:1 non-text threshold, but the split wasn't worth keeping for one button). Uniform ghost style clears 14.63:1 everywhere and simplifies the system.
- **Icon buttons**: 28x28px, inline SVG copied verbatim from Lucide (lucide.dev, ISC license) per icon needed, no library/bundler dependency. Every icon button gets a `title` and `aria-label` matching its action (icons alone aren't accessible names). A completed/success action (Save, Copy) swaps its icon to a checkmark rather than relying on text, since there's no label to change.
- **Text input**: background token, border token, accent-colored focus outline (visible, not `outline: none`). All buttons and inputs also get a `title` tooltip even when they have visible text, for consistency and extra context on hover.

Every new feature (flashcard buttons, quiz page) styles against these tokens and patterns rather than re-deriving new ones. Any deviation gets its own one-line reason added here first.
