# Portfolio v2 — Piano 13: Esperienza a capitoli — Implementation Plan

## Stato (2026-10-06): completato

Rulings: lavori in ordine cronologico (il mazzo e la pila su telefono finiscono sul ruolo attuale; il Markdown per gli agenti resta dal più recente); solo fatti già nel repo (LinkedIn non leggibile senza login): punti tolti quando non avevano una fonte.

**Goal:** an Experience section with real content per role and one interaction that answers the user: a pixel chapter track that fills with the deck and jumps to a card.

**Spec:** `docs/superpowers/specs/2026-10-06-portfolio-v2-experience-chapters-design.md`.

## Global Constraints

- WCAG 2.2 AA both themes; reduced motion = static, all lit; chapter links work without JS.
- No green; sentence case; bilingual EN/IT; `npm run verify` exits 0.

## Review Focus

1. Existing e2e select `#experience li`: highlights add nested `li`, so selectors move to `.timeline > li`.
2. A taller card must still fit the pinned deck under the header at 1280×720.
3. Clicking a chapter while the deck is pinned must land on that card, not on the anchor's layout position inside the pin spacer.
4. Studies are not cards: they never join the deck or the sticky pile.

### Task 1: Model and content

- [x] `ExperienceItem` gets `highlights`, `tags`, optional `caseStudy` slug and `short` (chapter label); `SiteContent.studies` holds the degree and the certificate.
- [x] EN/IT content; content.spec keeps the two languages aligned; geo-files lists highlights and studies.

### Task 2: Template and chapter track

- [x] Unit/e2e first: three work cards, highlights, tags, ApexFlow link, studies list, chapter links to `#exp-<n>` with full names.
- [x] Template and styles; `experience.ts` fills the track cells and sets `aria-current`; a click scrolls to the card's point in the pin.

### Task 3: Close

- [x] Screenshots desktop 1280 and phone 390, both themes; README, spec §17, edm-style; verify, PR, CI, merge.
