---
title: Perché Spring Boot se conoscevo già TypeScript?
description: Un amico senior backend mi ha chiesto perché la mia tesi abbinasse Angular a Java invece che a NestJS. Cosa ha guidato la scelta, quanto è costata e cosa ne penso oggi.
date: 2026-10-11
project: apexflow
---
"Perché imparare Java e Spring Boot se conosci già TypeScript?"

Me l'ha chiesto un amico che lavora come sviluppatore backend senior, mentre studiavo NgRx per la tesi e volevo un suo parere sull'architettura. Gli ho raccontato lo stack: Angular 19 e Signals lato client, Spring Boot 3 su Java 21 lato server. La sua reazione: "Perché ti sei complicato la vita con Java? Sai già TypeScript, potevi usare NestJS e avere tutto in JS e TS."

È una domanda giusta, e mi ha fatto ragionare fino in fondo.

## Le ragioni di NestJS

NestJS sarebbe stata la scelta comoda, e non solo per il linguaggio:

- **Un linguaggio da un capo all'altro.** Lo stesso TypeScript nel browser e sul server, gli stessi strumenti, le stesse regole di lint.
- **Tipi condivisi.** L'interfaccia `Customer` che le tabelle mostrano poteva essere esattamente il tipo che l'API restituisce, senza copie tenute a mano dalle due parti.
- **Una forma familiare.** Moduli, decorator e dependency injection: NestJS si ispira apertamente ad Angular, quindi il back end sarebbe sembrato il front end.

Per un progetto da solo, è tanto attrito in meno.

## Perché ho scelto comunque Spring Boot

Il motivo è stato il mercato. Java e Spring Boot fanno girare una grossa parte dei back end enterprise, ed è lo stack che la maggior parte degli annunci che leggevo chiedeva accanto ad Angular. La tesi è l'unico progetto in cui scelgo lo stack per imparare, non per consegnare in fretta, quindi ho scelto quello che avrei incontrato al lavoro.

C'era un secondo motivo che ho visto solo dopo: far comunicare due mondi diversi è una competenza a sé. In ApexFlow il contratto tra i due è esplicito. Da una parte entità e repository di Spring Data JPA:

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

Dall'altra i modelli TypeScript, e in mezzo HTTP. Niente è condiviso per caso, quindi ogni campo su cui il front end conta è una decisione.

## Quanto è costato

- **Tutto in doppio.** Due linguaggi, due strumenti di build (npm e Maven), due configurazioni di test, due deploy: il front end su Vercel, l'API su Render con PostgreSQL in Docker.
- **Tipi scritti due volte.** Un campo rinominato in un'entità Java è una tabella rotta finché il modello TypeScript non si allinea. Generare il client da una descrizione OpenAPI è la correzione che aggiungerei per prima.
- **Partenza più lenta.** Le prime settimane sono andate a Spring stesso (bean, JPA, CORS, Spring Security) più che alle funzionalità.

## Cosa ne penso oggi

Per un team tutto TypeScript che vuole andare veloce, NestJS è una scelta solida e non la sconsiglierei. Per me, in questo momento, Spring Boot è stato l'investimento migliore: è quello che probabilmente troverò dietro un front end Angular enterprise, e costruire entrambe le parti mi ha insegnato cosa un front end può chiedere a un back end, e cosa no.

La domanda del mio amico resta una buona domanda da farsi all'inizio di ogni progetto. La risposta dipende solo da a cosa serve il progetto.
