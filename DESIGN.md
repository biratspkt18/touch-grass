# Design

Visual system for Touch Grass (React Native / Expo). Tokens live in `src/theme/theme.ts` — that file is the source of truth; this document explains intent.

## Theme

Light, airy, photo-forward. White chrome over a faintly green-tinted app background; photographs and the map supply the color. Brand green appears only on primary actions, selection states, and the map's own pins/dots.

## Color

- `bg` #F3F7F1 — app background (faint green-tinted off-white)
- `surface` #FFFFFF — cards, bars, sheets
- `surfaceSunken` #ECF2EA — inputs, wells
- `ink` #13231A / `inkMuted` #566356 / `inkFaint` #8A968C — text ramp
- `primary` #16A34A — THE green. Primary buttons, active chip, selected tab, map pins. Nothing else.
- `primarySoft` #E3F5E8 / `primaryInk` #0B5D2C — soft tint + readable ink for selected chips
- `accent` #FF6F52 (coral) — hearts/likes and error text only
- `border` #E4EBE2 / `borderStrong` #D3DDD0

**Spend rule:** a screen's chrome is white/neutral; green appears at most twice per screen (primary action + selection). Gradients are retired except the raised Add button.

## Typography

- Display: Fredoka (500/600/700) — screen titles and hero headings only. Never on buttons, labels, or data.
- Body: Nunito (400/600/700/800) — everything else.
- Scale: title 26–28, section 18, body 15, meta 12.5.

## Components

- **Cards** — white, radius.lg (20), soft shadow, photo on top with radius on all corners of the image block; text below the photo, never overlaid (Airbnb card grammar).
- **Chips** — pill, surfaceSunken default, primarySoft + primaryInk when selected, 1px border.
- **Buttons** — primary: solid `primary`, white text, radius.md, 15–16pt bold. Secondary: white with 1px border. No gradient buttons (except the Add tab FAB).
- **Top bars** — white (or floating pills over the map), title in Fredoka, avatar button top-right (32–36pt circle) opening the profile.
- **Inputs** — surfaceSunken fill, 1px border, radius.md.
- **Empty states** — emoji + Fredoka headline + warm one-liner; this is where whimsy lives.

## Layout

- Screen padding: spacing.xl (20). Card gutters: spacing.lg.
- Bottom tab bar: Map · Add (raised FAB) · Feed. Profile is NOT a tab — it's the avatar in each screen's top-right.
- Map chrome floats: search pill and avatar as separate floating controls, not an opaque bar.

## Motion

150–250ms, ease-out. State feedback only (press opacity, heart spring). No page-load choreography.
