# Sintesi

[www.emanueledelmonte.it](https://www.emanueledelmonte.it) è il portfolio di Emanuele Del Monte, frontend developer. Questo handbook racconta come è costruito: l'architettura, le decisioni tecniche con il loro perché e la guida per lavorarci.

## In breve

| | |
|---|---|
| **Framework** | Angular 22: componenti standalone, signals, change detection zoneless |
| **Rendering** | prerender statico di ogni pagina (`outputMode: "static"`), nessun server Node |
| **Lingue** | inglese e italiano, due build separate con `@angular/localize` |
| **Hosting** | Netlify: redirect di lingua, 404 per lingua, header di sicurezza |
| **Motion** | GSAP (ScrollTrigger, SplitText, ScrollSmoother) caricato dopo la prima pittura |
| **3D** | un moai a voxel in Three.js, caricato solo quando entra in vista |
| **Qualità** | ESLint strict, Vitest, Playwright con axe (WCAG 2.2 AA) su cinque browser, Lighthouse CI |

## Gli obiettivi

- **Veloce sul telefono**: Lighthouse mobile ≥ 0.95 in CI, CLS a zero, JavaScript iniziale sotto i 144 KB gzip (il build fallisce oltre).
- **Accessibile**: WCAG 2.2 AA in entrambi i temi, ogni animazione rispetta `prefers-reduced-motion` e un pulsante nell'header la ferma tutta.
- **Vivo ma mai d'intralcio**: una nuvola di pixel, un moai che respira e segue il mouse, cuciture di pixel tra le sezioni, un easter egg da videogioco.
- **Leggibile dalle macchine**: JSON-LD, sitemap con hreflang, `llms.txt` e una copia Markdown di ogni pagina.
- **Niente tracciamento**: nessun analytics, nessuno script di terze parti.

## Da dove partire

- [Architettura](architettura.md): dal sorgente alla pagina servita da Netlify.
- [Decisioni tecniche](decisioni/motion.md): i problemi incontrati e come sono stati risolti.
- [Guida per sviluppatori](guida/setup.md): comandi, test e workflow.

Il codice è su [GitHub](https://github.com/xdelmo/Portfolio-minimal).
