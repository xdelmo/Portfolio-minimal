# Portfolio v2 — Piano 11: Contatti e footer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Stato (2026-10-05): completato

Decisioni prese durante l'esecuzione, su richiesta:

- La foto resta nella sezione contatti.
- Tolta la riga con l'indirizzo e il pulsante "Copy address" ("l'email con il bottone non mi piace"): si scrive dal titolo, e il footer ha il link "Email". Il componente `CopyEmail` non esiste più.
- LinkedIn ha il suo marchio a pixel (`layout/linkedin-mark.ts`), come GitHub.
- Il pulsante "Press start" nel footer è stato incluso: l'utente ha approvato la proposta che lo conteneva.

**Goal:** The contact finale says what to write about and makes the giant title the action; the footer stops repeating the contact and gains a way back to the top.

**Architecture:** Template and style changes in `pages/home/home.ts` and `layout/site-footer.ts`; one small `CopyEmail` component for the clipboard button (rendered only after hydration, since it needs JavaScript); one 8 × 8 pixel arrow icon. `finale.ts` splits the link inside the title.

**Tech Stack:** Angular 22, `@angular/localize`, Playwright + axe.

**Spec:** request "come possiamo migliorare la sezione contatti e footer?" and the comparison with the three reference sites (matteovincenti.com, marimba.design, craft.wild.as) made on 2026-10-05; style `.claude/skills/edm-style/SKILL.md`. Decided under the goal "vai avanti con piano, spec, test in modo indipendente": the user has not reviewed this design yet.

What the references share and the site lacked: the closing title is the action (matteovincenti: the whole "PARLIAMONE." line is the link, with a big arrow that moves on hover); one sentence says what to write about (all three); secondary channels are buttons or tags (marimba, craft); the footer is minimal and repeats nothing (copyright, back to top, profiles).

## Global Constraints

- WCAG 2.2 AA in both themes; targets at least 24 × 24 px; the copy result is announced (`aria-live`).
- Reduced motion: no arrow movement.
- Pointer effects only with `(hover: hover)`.
- No green; sentence case; no arrows typed as text, only the pixel icon.
- Bilingual: every string in EN and IT.
- `npm run verify` exits 0 (run against this checkout's server: check port 4300 first).

## Review Focus

1. Without JavaScript the copy button would do nothing: it must not be in the prerendered page.
2. The clipboard can be refused (permissions, insecure context): the button must say so and point to the address.
3. The footer is on every page, case studies included: it keeps email, LinkedIn and GitHub, but shows "Email" instead of repeating the address.
4. "Back to top" must stay on the current page (`<base href="/en/">` turns `#` into the home page).
5. SplitText on a title that now holds a link: the rise of the lines and the accessible name must survive.

Out of scope: a contact form (needs the privacy page, issue #3).

---

### Task 1: Contact finale

- [ ] E2E (`e2e/contact.spec.ts`): the title is a link to `mailto:` named "Get in touch" / "Contatti"; the section shows the lede and the availability; LinkedIn and GitHub tags with `rel="me"`; "Copy address" puts the address on the clipboard and announces "Address copied" (Chromium); without JavaScript there is no copy button.
- [ ] Template, styles, `CopyEmail`, pixel arrow; `finale.ts` splits the link; i18n EN/IT.

### Task 2: Footer

- [ ] E2E: the footer shows © year and name, links Email (`mailto:`), LinkedIn, GitHub and "Back to top"; it never prints the address; "Back to top" on a case study scrolls to the top and stays on that page.
- [ ] Template, styles, i18n.

### Task 3: Close

- Screenshots desktop 1280 and phone 390 in both themes; README, spec §17 row, edm-style if needed.
- `npm run verify` exits 0; branch, PR into `v2`, CI, merge.
