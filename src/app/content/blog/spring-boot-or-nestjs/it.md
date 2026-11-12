---
title: Perché Spring Boot se conoscevo già TypeScript?
description: Un amico senior backend mi ha chiesto perché la mia tesi abbinasse Angular a Java invece che a NestJS. Cosa ha guidato la scelta, quanto è costata e cosa ne penso oggi.
date: 2026-10-11
project: apexflow
---
"Perché imparare Java e Spring Boot da zero se padroneggi già l'ecosistema TypeScript?"

Me lo ha chiesto un ingegnere backend senior durante una revisione informale dell'architettura di ApexFlow. Gli stavo descrivendo le scelte tecniche: Angular 19 con Signals per il client, Spring Boot 3 su Java 21 per il server. La sua osservazione era pragmatica: con NestJS avrei mantenuto un unico linguaggio, condividendo modelli di tipo, tooling e configurazioni di lint su tutto lo stack.

Era una domanda legittima. Mi ha spinto a formalizzare i motivi di una scelta deliberatamente orientata al contesto enterprise.

## I vantaggi immediati di NestJS

NestJS rappresentava senza dubbio la soluzione a minor attrito per un progetto sviluppato da un unico ingegnere:
- **Omogeneità del linguaggio:** lo stesso TypeScript nel browser e su Node.js, riducendo il cambio di contesto mentale.
- **Tipizzazione condivisa:** la stessa interfaccia `Customer` avrebbe potuto viaggiare dal database alla vista, azzerando le duplicazioni manuali di codice.
- **Paradigma coerente:** moduli, decorator e dependency injection in NestJS ricalcano la struttura di Angular, offrendo una curva di apprendimento naturale.

Per massimizzare la velocità di rilascio iniziale, NestJS sarebbe stata la scelta ovvia.

## Perché ho scelto comunque Spring Boot

La prima motivazione è stata la realtà del mercato enterprise. Java e l'ecosistema Spring alimentano l'infrastruttura di innumerevoli aziende su scala globale, ed è la combinazione tecnologica che compare con maggior frequenza accanto ad Angular nei team di grandi dimensioni. Un progetto di tesi ingegneristica è l'opportunità ideale per investire sulle competenze architetturali che si incontreranno sul campo, anziché ottimizzare per la sola scorciatoia di sviluppo.

La seconda motivazione, ancora più rilevante sul piano del design software, riguarda la **definizione esplicita dei confini architetturali**. 

Quando frontend e backend condividono lo stesso linguaggio e lo stesso archivio di tipi, il rischio di accoppiamento occulto è costante: entità di persistenza o dettagli di database rischiano di trapelare direttamente nei componenti grafici. Con due ecosistemi distinti, il contratto HTTP diventa necessariamente rigoroso e deliberato.

Da un lato abbiamo i controller, i repository e le entità JPA in Spring:

```java
@RestController
@RequestMapping("/api/customers")
public class CustomerController {
  private final CustomerRepository customers;

  public CustomerController(CustomerRepository customers) {
    this.customers = customers;
  }

  @GetMapping("/{id}")
  public Customer getCustomer(@PathVariable String id) {
    return customers.findById(id).orElseThrow();
  }
}
```

Dall'altro i modelli TypeScript in Angular, collegati esclusivamente da un contratto JSON via REST. Niente viene ereditato per caso: ogni singolo campo esposto al client rappresenta una decisione d'interfaccia consapevole.

## Il costo operativo della scelta

Costruire su due stack eterogenei comporta compromessi reali:
- **Doppia catena di build e deployment:** due runtime separati, due gestori di dipendenze (npm e Maven), due pipeline di test e due infrastrutture di hosting (Vercel per il frontend statico, Render con PostgreSQL in Docker per il backend).
- **Sincronizzazione manuale dei contratti:** modificare una proprietà in un'entità Java richiede un aggiornamento speculare nei tipi TypeScript. In uno scenario aziendale, l'adozione di un approccio contract-first con generazione automatica dei client tramite OpenAPI rappresenterebbe la naturale evoluzione.
- **Curva di setup iniziale:** configurare l'iniezione delle dipendenze, la sicurezza delle rotte, i vincoli CORS e Spring Data JPA richiede un investimento di tempo superiore rispetto a un rapido bootstrap in Node.js.

## Conclusioni

Per una startup o un team snello che punta alla massima velocità di prototipazione, NestJS rimane un'eccellente opzione architetturale. 

Per me, costruire ApexFlow con Spring Boot 3 è stato il miglior investimento possibile. Mi ha permesso di comprendere a fondo le responsabilità e le complessità del server, insegnandomi esattamente cosa un frontend engineer enterprise può pretendere da un'API — e cosa invece deve risolvere autonomamente nell'interfaccia utente.
