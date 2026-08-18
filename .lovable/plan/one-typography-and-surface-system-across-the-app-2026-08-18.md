# One typography and surface system across the app

Right now each screen picks its own card background and heading style by hand. The dashboard's "Welcome to the Verifiabul ecosystem" card is tinted beige/tan while the cards around it are white, and headings inside cards are sometimes the serif display font, sometimes plain bold body text. This defines one rule set and applies it everywhere. No backend or API work.

## The rules

Typography
- Page titles and section titles: display serif (Instrument Serif).
- Card titles: display serif, one consistent size.
- Small labels above values (stat labels, field labels, table headers): uppercase eyebrow style, body font.
- All paragraphs, list items, form text, help text: body font (Work Sans), one size for body and one smaller size for supporting text.
- Numbers in stat tiles stay display serif.

Surfaces and color
- Default card: white card surface with the standard border and soft shadow. This is the norm — most cards.
- Notice card (informational callouts like the ecosystem welcome): one single tinted treatment, used identically everywhere, so no more one-off beige/tan/teal mixes.
- Highlight card (staff access, action prompts): white surface with the accent border only, no fill.
- Inner rows and sub-panels inside a card (document rows, list rows, admin sub-boxes): one single muted inset surface, replacing the current mix of `bg-surface`, `bg-card/60`, `bg-secondary/40`, `bg-accent/60`.
- Green stays reserved for verified/success states only. Teal stays the primary action color.

## What changes in the code

- `src/components/ui-kit.tsx`: add a `tone` prop to `Card` (`default | notice | highlight | inset`) plus small `CardTitle`, `Eyebrow`, `Body`, `Muted` text primitives that encode the typography rules.
- `src/styles.css`: add the notice/inset surface tokens so the tints are named design tokens, not ad-hoc opacity values.
- Replace hand-written background and heading classes with the new primitives in:
  - `src/components/ecosystem-consent-panel.tsx` (the welcome card becomes the `notice` tone)
  - `src/routes/_authenticated/dashboard.tsx`
  - `src/components/connected-apps.tsx`, `correction-review.tsx`, `document-slots.tsx`, `status-history.tsx`, `profile-form.tsx`
  - `src/routes/_authenticated/register-property.tsx`, `registrations.$id.tsx`, `profile.tsx`, `ecosystem-consent.tsx`
  - `src/routes/_authenticated/registry-admin.index.tsx`, `registry-admin.queue.tsx`
  - `src/routes/index.tsx`, `src/components/site-footer.tsx`, `site-header.tsx`
- Dark mode values updated for the new tokens so tints stay legible.

## Not in this change

- No new API endpoints and no change to the existing identity exchange endpoint. Nothing becomes queryable that isn't already.
- No layout restructuring, no copy changes, no schema changes.

## Check when done

Walk the dashboard, profile, registration wizard, registration detail and admin queue and confirm every card uses one of the four tones and every title uses the same font, at the same size, in the same position.
