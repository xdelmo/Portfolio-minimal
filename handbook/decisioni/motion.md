# Motion

Le animazioni sono GSAP con ScrollTrigger, SplitText e ScrollSmoother. Il problema da risolvere: tante animazioni legate allo scroll senza pesare sulla prima pittura e senza disturbare chi preferisce meno movimento.

## Caricamento

- GSAP arriva come chunk lazy tramite il token `MOTION_LOADER`, e solo dopo la prima pittura (`afterPaint()`).
- `motion/gsap.ts` valuta GSAP, ScrollTrigger e SplitText **un import alla volta**: caricati insieme erano long task che tenevano la home a 0.93 su Lighthouse per il Total Blocking Time.
- La direttiva `[appMotion]` (`motion/motion-host.ts`) avvia ogni effetto **in un task separato**, dentro `gsap.matchMedia`.
- Con `prefers-reduced-motion` GSAP non viene nemmeno scaricato.

## Desktop e telefono

Pin ed effetti legati al puntatore sono solo desktop (≥ 1024px con hover). Sui telefoni ogni idea ha una versione a scroll e touch: card sticky che si impilano, livelli che entrano a scatti, swipe sul moai.

Un effetto con due versioni imposta, in ciascuna, ogni proprietà di transform che l'altra muove: un resize oltre i 1024px annulla gli stili inline ma non la cache dei transform di GSAP.

## Smooth scroll

ScrollSmoother (`motion/smoother.ts`) è attivo solo su desktop con mouse e mai con reduced motion. Sposta `#smooth-content` con un transform, quindi:

- gli elementi fissi e l'header stanno fuori da `#smooth-wrapper`;
- `position: sticky` lì dentro non funziona e viene sostituito da `effects/sticky.ts` (attributo `data-sticky`);
- lo scroll da codice (ancore, cambi di pagina) passa da `smoother()`.

## Lezioni imparate

!!! note "Scrub e Firefox"
    Per i tween con scrub si usa `gsap.set` + `.to()`: un `.from()` con scrub non viene ridisegnato in Firefox dopo un refresh.

!!! note "Niente `@defer (hydrate …)` sulle sezioni della home"
    I pin e il filo di pixel misurano le sezioni prima che siano idratate: provato, cinque test e2e fallivano.

!!! note "Una sola pausa"
    `MotionPause` (`motion/pause.ts`) è l'unico interruttore: il codice Angular lo inietta, gli effetti GSAP usano `watchPause()`. È il pulsante dell'header che ferma tutto il movimento automatico (WCAG 2.2.2).
