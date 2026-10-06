# Esperienza a capitoli — design

Data: 2026-10-06. Richiesta: "la sezione esperienza è scarna sia di contenuto che di interazione rispetto le altre. Come migliorare? Usa anche la skill frontend". Deciso sotto il goal "sii indipendente nei piani, spec e nelle domande e risposte"; date solo per anni (risposta dell'utente), agenzia senza nome. La carriera completa è su LinkedIn, che non si legge senza login: i fatti vengono solo dai testi del sito, dal case study ApexFlow e dal vecchio sito Gatsby (`master`). Da rifinire quando l'utente incolla la sezione Esperienza di LinkedIn.

## Problema

- Ogni voce è una frase sola; lavoro, laurea e certificato pesano uguale; nessuna voce dice con quali tecnologie né rimanda ai progetti.
- L'unica interazione è il mazzo bloccato su desktop: si subisce, non si usa. Le altre sezioni hanno qualcosa che risponde (anelli, sprite, moai).

## Design

1. **Lavoro e studi separati.** Il mazzo (desktop) e le carte sticky (telefono) contengono solo il lavoro: Frontend Specialist in IPS, tirocinio in IPS, agenzia. Laurea e Agile Masterclass vanno sotto, in "Studies and certificates" / "Studi e certificati": righe compatte, niente carte.
2. **Ogni carta di lavoro** ha periodo, ruolo, azienda, la frase di sintesi, 2–3 punti concreti, i tag delle tecnologie (stesso stile degli Strumenti) e, quando esiste, un link al case study (tirocinio → ApexFlow). Nessun numero inventato.
3. **Traccia a capitoli** (l'idea forte, una sola): sopra le carte, una riga di celle a pixel con una tappa per carta (anno e ruolo breve). Le tappe sono link alle carte (`#exp-<n>`), quindi funzionano senza JavaScript. Su desktop con il mazzo bloccato:
   - le celle si riempiono con l'avanzare del mazzo (sostituisce la linea `--progress`);
   - la tappa della carta in cima è `aria-current="step"`;
   - un clic porta lo scroll al punto del pin dove arriva quella carta.
4. Movimento ridotto: tutto acceso, nessuna animazione; i link restano ancore.

## Vincoli

- WCAG 2.2 AA in entrambi i temi; target ≥ 24 px; i link della traccia hanno un nome completo ("2026, Frontend Specialist at IPS S.p.A.").
- Niente verde, sentence case, niente numeri come decorazione (le tappe sono anni, informazione vera).
- Il mazzo deve stare sotto l'header a 1280×720 con la carta più alta.
- Bilingue; `llms.txt`/Markdown riportano punti e studi.

## Scelte fatte in esecuzione

- Lavori in ordine cronologico: il mazzo su desktop e la pila su telefono finiscono sul ruolo attuale, la traccia si legge da sinistra a destra come un percorso. Il Markdown per gli agenti resta dal più recente.
- Punti senza una fonte nel repo tolti: meglio una carta con un punto che un fatto inventato.
