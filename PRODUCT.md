# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Recruiters and tech leads hiring a Frontend Engineer, in Italy and for full-remote roles (Italian companies included, and abroad). They arrive from LinkedIn, Google or an AI agent, usually on a first, short visit, and decide whether to get in touch.

## Product Purpose

The personal portfolio of Emanuele Del Monte (www.emanueledelmonte.it). Its job is to find the next role: the contract at IPS S.p.A. ends in March 2027 and the search starts in January 2027, so the site must be live in the first half of December 2026.

Success: within 30 seconds a visitor understands who Emanuele is, his level (Frontend Engineer, Angular/Signals, enterprise context), sees ApexFlow as the lead project and knows how to contact him.

## Positioning

"I build Angular interfaces that stay fast when the data gets big": Angular and Signals in an enterprise context (IPS S.p.A., ApexFlow's server-side tables), backed by the site itself as proof of craft: the living pixel field, the voxel moai, the hidden game, Lighthouse performance ≥ 0.95 and WCAG 2.2 AA in both languages and themes.

## Operating Context

- Bilingual (English source, Italian translation), language from the browser plus a manual switch; light and dark theme from the OS plus a toggle.
- Visitors read on desktop and phone; an AI agent reads `llms.txt` and the Markdown copy of every page.
- Home (hero, about, selected work, side quests, experience, stack, contact), one page per case study, a blog, privacy page.
- Case study structure: problem → architecture → technical choices → result → demo and repository links.

## Capabilities and Constraints

- Angular 22, fully prerendered static site on Netlify; details in `CLAUDE.md` and `docs/superpowers/specs/2026-10-03-portfolio-v2-design.md`.
- Content lives in `src/app/content/content.{en,it}.ts` and `src/app/content/blog/`; UI strings through `@angular/localize`.
- Repositories are linked only when public (`onlyPublic()`); never hard-code which ones are.
- Location: "Latina, IT / Remote". Title: Frontend Engineer.

## Brand Commitments

- Voice: plain, first person, specific; buttons say what happens; no filler, no selling adjectives.
- Colours are greys, the `--accent` blue family, lavender and peach: no green anywhere.
- The visual system is binding and lives in `.claude/skills/edm-style/SKILL.md`.
- The voxel moai mascot (a nod to the 🗿 of the old site).

## Evidence on Hand

- Case studies: ApexFlow (lead, the first and widest card on the home), PokèVerba; side quests Telegram bots and 3D-printed CAD objects. Images in `public/images/work/`.
- Experience, education and certifications as on LinkedIn (aligned 2026-10-06), in the content files.
- Blog posts in `src/app/content/blog/` are drafts written from LinkedIn posts, not yet reviewed by Emanuele.
- Absent, never to be fabricated: CV (not published, never mentioned), metrics, testimonials, clients, press.

## Product Principles

1. Clarity first: role, level and contact readable in 30 seconds, before any effect.
2. The site is the proof: every effect must also be fast and accessible, or it does not ship.
3. Only true, verifiable content: real projects, public repositories, no invented claims.
4. Equal in both languages, both themes, desktop and phone.

## Accessibility & Inclusion

WCAG 2.2 AA on every page, language, theme and viewport (spec §11): reduced motion loads no GSAP, every long animation can be paused, everything works by keyboard and without JavaScript.
