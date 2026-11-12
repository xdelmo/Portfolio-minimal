---
target: src/app/pages/blog
total_score: 36
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 0
target_identity: "file:/Users/emanueledelmonte/development/Portfolio-minimal/src/app/pages/blog"
timestamp: 2026-11-12T08-16-14Z
slug: src-app-pages-blog
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|:-----:|-----------|
| 1 | Visibility of System Status | 4 | La reading progress bar usa `position: sticky` con `data-sticky` e `stickyEffect`, restando visibile e ancorata durante tutto lo scorrimento dell'articolo. |
| 2 | Match System / Real World | 4 | La CTA in `ContactPrompt` dichiara esplicitamente "Message on LinkedIn" / "Scrivimi su LinkedIn" allineandosi al link; la navigazione tra articoli adiacenti segue fedelmente l'ordine cronologico. |
| 3 | User Control and Freedom | 4 | Percorsi di uscita puliti, scrolling da tastiera nei blocchi di codice, recupero 404 coerente. |
| 4 | Consistency and Standards | 4 | Sentence case rispettato su `.project-tag` e `.lang-tag` (niente uppercase forzato né monospace cosmetico); target touch del pulsante copia a 44px su schermi touch. |
| 5 | Error Prevention | 4 | Copia sicura con `afterNextRender`, prerendering statico privo di discrepanze. |
| 6 | Recognition Rather Than Recall | 4 | Syntax highlighting sobrio (blu, accento, lavanda, grigio) senza verde; byline autore visibile immediatamente sotto il titolo. |
| 7 | Flexibility and Efficiency | 4 | Breakout a 72ch dei blocchi di codice su schermi desktop (≥768px), azzerando lo scorrimento orizzontale non necessario; prosa confortevole a 53ch. |
| 8 | Aesthetic and Minimalist Design | 4 | Gerarchia di chiusura ottimizzata con il case study prima della CTA di contatto; bordo sinistro del blockquote allineato a 2px sulla griglia 8px. |
| 9 | Error Recovery | 4 | Pagina 404 dedicata con link di ritorno chiaro. |
| 10 | Help and Documentation | n/a | Non applicabile per una superficie editoriale/portfolio (Read / Experience). |
| **Total** | | **36/36** | **Excellent (100%)** |

#### Design Specificity Verdict
Tutte le discrepanze di afferenza, gerarchia e aderenza alle linee guida di `DESIGN.md` sono state risolte. L'esperienza di lettura è ora perfettamente integrata nell'ecosistema del portfolio di Emanuele Del Monte, con un'evidenziazione del codice sobria e priva di verde, una barra di lettura fluida e ancorata, e la corretta attribuzione autore.

#### Deterministic scan & Suite test
- `npm run lint`: 0 errori, 0 warning.
- `npx ng test`: Tutti i test unitari passati.
- Playwright e2e + axe-core (`e2e/blog.spec.ts`, `e2e/pages.spec.ts`): 0 violazioni WCAG 2.2 AA in entrambi i temi.
