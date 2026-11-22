---
title: Un’API Spring Boot che parla come json-server
description: Come ho costruito il backend di ApexFlow in Spring Boot e Java 21 perché la dashboard Angular passasse da un server finto a un’API vera senza cambiare una riga.
date: 2026-11-22
project: apexflow
---
La dashboard di ApexFlow è nata contro json-server: un file `db.json` e una finta API REST con un solo comando. Mi ha permesso di costruire tabelle, filtri e form prima che esistesse un backend vero. Il prezzo è un contratto: il frontend impara il dialetto di json-server, `_page`, `_limit`, `_sort`, `name_like`, il totale in un header `X-Total-Count`.

Quando è arrivato il momento del backend vero, mi sono dato una regola: il frontend non cambia. Passare dal mock a Spring Boot doveva essere una questione di configurazione, `npm run start:springboot` al posto di `npm start`. Questo post racconta cosa ha chiesto quella regola al backend.

## Lo stack

Spring Boot 4 su Java 21, Spring Data JPA su PostgreSQL, Maven, un’immagine Docker su Eclipse Temurin. Cinque risorse (clienti, ordini, prodotti, utenti, statistiche dei clienti), ognuna con controller, service e repository.

## Un solo parser per tutte le liste

Ogni endpoint di lista prende tutti i parametri della query come mappa e li passa a una sola classe di utilità, `QueryFilterParser`. Lei trasforma la mappa nelle due cose che Spring Data capisce: un `Pageable` per pagina, dimensione e ordinamento, e una `Specification` per i filtri.

```java
@GetMapping
public ResponseEntity<List<Customer>> getCustomers(@RequestParam Map<String, String> allParams) {
  Page<Customer> page = customerService.getCustomers(allParams);
  HttpHeaders headers = new HttpHeaders();
  headers.set("X-Total-Count", String.valueOf(page.getTotalElements()));
  return ResponseEntity.ok().headers(headers).body(page.getContent());
}
```

Il corpo è un semplice array, come lo restituisce json-server, e il totale viaggia nell’header che il paginatore di PrimeNG legge già. Le regole del dialetto stanno in un posto solo:

- `_page` parte da 1, come lo manda il frontend, e diventa la pagina di Spring che parte da 0.
- Una chiave che finisce in `_like` diventa un `LIKE '%valore%'` senza distinzione tra maiuscole e minuscole su quel campo.
- Ogni altra chiave che nomina un campo dell’entità diventa un confronto esatto; una chiave che non nomina nessun campo viene ignorata invece di far fallire la richiesta.

Così i cinque endpoint di lista si comportano allo stesso modo. Un nuovo filtro della dashboard su un campo che l’entità ha già non richiede codice sul server.

## Dove il dialetto non bastava

json-server sa filtrare su un record collegato, per esempio gli ordini per nome del cliente, perché sta tutto in un unico file JSON. In un database relazionale l’ordine conserva solo l’id del cliente. Per `customer.name_like` il service degli ordini trova prima i clienti che corrispondono, poi filtra gli ordini per i loro id:

```java
List<String> customerIds = customerRepository.findAll((root, query, cb) ->
    cb.like(cb.lower(root.get("name")), "%" + nameQuery + "%")
).stream().map(Customer::getId).toList();

spec = spec.and((root, query, cb) ->
    customerIds.isEmpty() ? cb.disjunction() : root.get("customerId").in(customerIds));
```

`_expand=customer`, che json-server usa per includere il cliente in ogni ordine, funziona allo stesso modo: prima la pagina di ordini, poi un solo `findAllById` per tutti i loro clienti, uniti con una mappa in memoria. I clienti costano una query per pagina, mai una per riga.

## Regole di business che json-server non poteva avere

Il mock poteva solo salvare quello che riceveva. Il backend vero è il posto dove sono finite le regole del dominio:

- **Un ordine estende l’abbonamento.** Creare un ordine con prodotti mensili o annuali aggiunge i mesi alla data di scadenza del cliente, da oggi o da una scadenza ancora futura, e segna il cliente come attivo. Nella stessa transazione aggiorna i totali del cliente: numero di ordini, fatturato, data dell’ultimo ordine.
- **Gli abbonamenti scadono da soli.** Un job `@Scheduled` gira ogni notte all’una, e una volta all’avvio, e segna come scaduti i clienti attivi la cui data di fine è passata.
- **Gli errori hanno una sola forma.** Un `@RestControllerAdvice` trasforma errori di validazione e argomenti non validi in un 400 con un corpo JSON fisso, e qualsiasi eccezione imprevista in un 500 con un messaggio generico. Lo stack trace resta nel log.

## Cosa cambierei

Tre cose le farei diversamente:

- **Ordinamento su un campo collegato.** Il parser ignora `_sort=customerStats.totalRevenue`; quel caso lo gestisce il service dei clienti per conto suo, ordinando e paginando in memoria. Un join nella `Specification` lo riporterebbe nel codice condiviso.
- **I totali nel database.** Il fatturato totale e quello mensile caricano tutti gli ordini e li sommano in Java. Con sette ordini non conta; con settantamila sarebbe una `SUM` con `GROUP BY` sul mese in una query del repository.
- **Id generati bene.** Gli id degli ordini vengono da un numero casuale di quattro cifre: va bene per una demo; in produzione, prima o poi, due ordini avrebbero lo stesso id. Una sequence o un UUID tolgono il problema.

## Cosa mi ha dato la regola

La regola “il frontend non cambia” ha tenuto il contratto in un posto solo, un parser e un header, e ha reso il passaggio dal mock all’API vera un non-evento. Mi ha anche mostrato il limite di partire da un mock: è json-server ad aver deciso la forma dell’API. Alcune sue comodità, come i filtri sui record collegati, in SQL sono più difficili di quanto sembrino in un file JSON. Il codice è su GitHub, in [xdelmo/backend-tesi](https://github.com/xdelmo/backend-tesi).
