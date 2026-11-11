# Sicurezza e privacy

## Header di sicurezza

`scripts/postbuild.mjs` scrive il file `_headers` di Netlify:

- una **Content-Security-Policy** costruita da `scripts/security-headers.mjs` a partire dalle pagine prerenderizzate: gli script del sito più gli hash `sha256` di quelli inline, ricalcolati a ogni build, così una modifica alle pagine non richiede mai di aggiornare la policy a mano;
- `nosniff`, divieto di framing, policy del referrer e dei permessi.

Qualsiasi risorsa caricata da un'altra origine va aggiunta alla policy. Un test e2e serve le pagine con la policy e fallisce a ogni violazione; `npm run verify:deploy` controlla gli header su un deploy.

## Privacy

Nessun analytics e nessuno script di terze parti. La pagina `/privacy` elenca esattamente cosa conserva il browser: il cookie `nf_lang`, il tema e tre voci di sessione. Va aggiornata prima di aggiungere qualsiasi strumento di misura.

Questo handbook usa lo stesso font del sito, servito da GitHub Pages insieme alle pagine. L'unica richiesta a terzi è quella di Material per Mermaid (da unpkg), e parte solo sulle pagine con un diagramma.

## Un handbook pubblico

Il repository e questo sito sono pubblici. `scripts/handbook-check.mjs` ferma il build dell'handbook se trova qualcosa che somiglia a un segreto (token, chiavi, URL di build hook), un indirizzo e-mail o un percorso locale; il suo test gira anche nella CI del sito. Spec, piani e materiale interno restano fuori.
