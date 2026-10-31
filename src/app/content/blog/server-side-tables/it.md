---
title: Gestire 10 record è facile, gestirne 10.000 è ingegneria
description: Paginazione, ordinamento e filtri lato server per le tabelle PrimeNG, con una sola classe TablePaginationState e il ponte tra Signals e RxJS.
date: 2026-10-11
project: apexflow
---
Nelle prime settimane del mio tirocinio in IPS ho incontrato uno dei problemi più comuni, e più sottovalutati, del frontend enterprise: tabelle di dati con paginazione e filtri lato server. Con dieci record carichi tutto e filtri nel browser. Con diecimila non puoi: il server pagina, ordina e filtra, e il frontend deve chiedere ogni volta esattamente la fetta giusta quando qualcosa cambia.

Ho portato quell'esperienza direttamente nella mia tesi, ApexFlow. Clienti, ordini e prodotti sono tabelle PrimeNG in modalità lazy, e volevo lasciarmi alle spalle l'approccio in cui ogni cambiamento chiama a mano un metodo `load()`.

## Cosa deve restare coerente

Una tabella lato server ha più stato di quanto sembri: la pagina corrente, la dimensione della pagina, il campo e il verso dell'ordinamento, i filtri di ogni colonna, una ricerca libera. Se ne cambia uno qualsiasi la tabella deve fare una richiesta, con tutti, e ignorare la risposta di ogni richiesta superata. Sparso in un componente diventa un `load()` chiamato da sei punti diversi, ognuno dei quali può dimenticare un parametro.

## Una classe per lo stato

`TablePaginationState` tiene ogni pezzo in un signal, e un solo `computed` li trasforma nei parametri che l'API si aspetta:

```ts
export class TablePaginationState {
  currentPage = signal(1);
  pageSize = signal(10);
  sortField = signal<string | undefined>(undefined);
  sortOrder = signal<'asc' | 'desc' | undefined>(undefined);
  filters = signal<Record<string, string | boolean>>({});
  totalRecords = signal(0);

  params = computed((): HttpParamsConfig => ({
    _page: this.currentPage(),
    _limit: this.pageSize(),
    ...(this.sortField() ? { _sort: this.sortField(), _order: this.sortOrder() ?? 'asc' } : {}),
    ...this.filters(),
  }));
}
```

PrimeNG riporta ogni cambio di pagina, ordinamento e filtro di colonna in un unico `TableLazyLoadEvent`. La classe lo traduce e imposta un signal solo se il suo valore è cambiato davvero (i filtri si confrontano in profondità), così un clic che non cambia niente non fa nessuna richiesta.

## Dallo stato alle richieste, senza subscribe

Il componente trasforma `params` in un observable, lascia a RxJS ciò che sa fare meglio e riporta il risultato in un signal per il template:

```ts
export class CustomerListComponent {
  pagination = new TablePaginationState();
  isLoading = signal(false);

  customers = toSignal(
    toObservable(this.pagination.params).pipe(
      tap(() => this.isLoading.set(true)),
      switchMap((params) => this.customerService.getCustomers(params)),
      tap((response) => {
        this.pagination.setTotal(response.total);
        this.isLoading.set(false);
      }),
      map((response) => response.data),
    ),
    { initialValue: [] },
  );
}
```

`toObservable` emette quando cambia un parametro qualsiasi, una volta per cambiamento. `switchMap` annulla la richiesta ancora in corso quando ne parte una più nuova, così una pagina 2 lenta non sovrascrive mai la pagina 3. `toSignal` si iscrive per il componente e si disiscrive quando viene distrutto.

## Il risultato

1. **Stato prevedibile.** Ogni tabella ha gli stessi pochi signal, e i parametri di una richiesta sono una funzione di quei signal: niente può andare fuori sincrono.
2. **Componenti puliti.** Un componente dichiara la sua tabella e cosa caricare. Non chiama mai `subscribe()` né `load()`, quindi non ha sottoscrizioni da distruggere.
3. **Un'integrazione realistica.** Il frontend delega davvero paginazione e filtri al server. Mentre l'API Spring Boot prendeva forma, al suo posto c'era un JSON Server con un piccolo middleware personalizzato; il contratto sono solo i parametri, quindi cambiare backend tocca il servizio, non le tabelle.

Ogni tabella di ApexFlow riusa la stessa classe.
