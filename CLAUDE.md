# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` (use `--legacy-peer-deps` if peer-dependency conflicts occur)
- `npm run develop` — dev server at http://localhost:8000
- `npm run build` — production build into `public/`
- `npm run serve` — serve the production build
- `npm run clean` — clear `.cache`/`public` (run this when content/GraphQL changes don't show up)

There are no tests or linters. Node >= 18 (Netlify deploys on Node 20.x).

## Architecture

Personal portfolio built on the npm package `gatsby-theme-portfolio-minimal` (Gatsby 5, React 18). Almost all UI and logic live in the theme inside `node_modules`; this repo only supplies content, page composition and style overrides.

- **`content/`** — the real "source" of the site, read by the theme via `contentDirectory` in `gatsby-config.js`:
  - `settings.json` — site metadata (language, SEO, social links), navigation, CTA, feature toggles (dark mode, cookie bar).
  - `sections/<name>/` — data for each section (`hero.json`, `projects.json`, `interests.json`, `contact.json`, `about.md`, `legal/*.md`). The section components in `src/pages/` load these by `sectionId`.
  - `images/` — referenced with paths relative to the JSON file (e.g. `../../images/foo.png` from `sections/projects/`).
  - `articles/` — blog posts (blog at `/blog`, configured in `gatsby-config.js`).
- **`src/pages/`** — composes theme components (`HeroSection`, `ProjectsSection`, `LegalSection`, `Page`, `Seo`, …) imported from `gatsby-theme-portfolio-minimal`. Section headings are passed as props here, not in content.
- **`src/gatsby-theme-portfolio-minimal/`** — Gatsby theme shadowing: files here replace the theme file at the same path. Currently only `globalStyles/theme.css` (CSS variables for `lightTheme`/`darkTheme`).

To change component behavior beyond what props/content allow, shadow the corresponding file from `node_modules/gatsby-theme-portfolio-minimal/src/` under the same relative path in `src/gatsby-theme-portfolio-minimal/`.

## Conventions

- Site content and UI copy are in Italian.
- Projects in `projects.json` have a `visible` flag to hide them without deleting.
- Project images: screenshots at 1080x810, framed with Screely (Plain Window, Regular style, 100px vertical/horizontal padding).
