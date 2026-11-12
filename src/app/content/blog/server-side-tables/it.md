---
title: Gestire 10 record è facile, gestirne 10.000 è ingegneria
description: Paginazione, ordinamento e filtri lato server per le tabelle PrimeNG, con una sola classe TablePaginationState e il ponte tra Signals e RxJS.
date: 2026-10-11
project: apexflow
---
Nelle prime settimane del mio percorso in IPS ho affrontato una delle sfide classiche del frontend enterprise: la gestione di tabelle dati su larga scala con paginazione, ordinamento e filtri delegati al server. Con dieci record puoi permetterti di caricare l'intero dataset e filtrarlo in memoria nel browser. Con diecimila record questo approccio fallisce: il server deve occuparsi di affettare e ordinare i dati, mentre il client deve richiedere in modo deterministico e reattivo solo i record visibili.

Ho portato questa lezione direttamente nel cuore di ApexFlow. Le schermate di clienti, ordini e prodotti sono tabelle PrimeNG in modalità lazy-loading, e il mio obiettivo era superare l'antipattern in cui ogni interazione utente invoca manualmente un metodo imperativo `loadData()`.

## L'anatomia dello stato di una tabella enterprise

Una tabella lato server gestisce una matrice di parametri più articolata di quanto appaia:
- La pagina corrente (`currentPage`) e la dimensione del blocco (`pageSize`).
- Il campo attivo e la direzione dell'ordinamento (`sortField`, `sortOrder`).
- I filtri di colonna e la query di ricerca globale (`filters`, `query`).

Se questi valori vivono sparsi nelle proprietà di un componente, ogni evento (click sull'intestazione, digitazione nel filtro, cambio pagina) rischia di comporre una richiesta parziale, dimenticando uno dei parametri o introducendo race condition.

## Incapsulamento reattivo: TablePaginationState

In ApexFlow ho isolato l'intera logica di paginazione nella classe `TablePaginationState`. Ogni parametro di navigazione è un `signal`, e un unico valore derivato `computed` genera l'oggetto di configurazione per i parametri HTTP:

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

PrimeNG emette tutte le interazioni dell'utente (paginazione, ordinamento, filtri) attraverso un singolo evento `TableLazyLoadEvent`. La classe normalizza l'evento e aggiorna i rispettivi signal solo quando il valore effettivo è cambiato (i filtri vengono verificati con un confronto in profondità). In questo modo, click ridondanti non innescano alcuna chiamata API superflua.

## Dallo stato al network: il ponte Signals-RxJS

Il componente converte il computed `params` in un flusso observable, delega a RxJS la gestione asincrona del ciclo di vita della richiesta e riconverte il risultato finale in un signal per il template:

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

L'architettura risolve tre problemi critici in poche righe:
1. **Eliminazione delle race condition:** `switchMap` cancella automaticamente qualsiasi richiesta HTTP ancora in volo se l'utente cambia pagina o digita un nuovo filtro. Una risposta ritardata della pagina 2 non potrà mai sovrascrivere i dati della pagina 3.
2. **Ciclo di vita pulito:** `toSignal` gestisce la sottoscrizione in modo automatico e la distrugge quando il componente viene smontato, eliminando qualsiasi `subscribe()` o `unsubscribe()` manuale.
3. **Disaccoppiamento totale dal backend:** I parametri HTTP rappresentano l'unico contratto tra client e server. Durante lo sviluppo del backend Spring Boot, il frontend ha operato contro un JSON Server con middleware personalizzato: il passaggio alle API definitive in Java ha richiesto modifiche solo agli endpoint di servizio, senza toccare la logica delle tabelle.

## Risultato

Ogni tabella dell'applicazione riutilizza la medesima classe `TablePaginationState`. Il codice dei componenti rimane dichiarativo: dichiara quali dati mostrare e come consumarli, lasciando al sistema reattivo la sincronizzazione infallibile tra interfaccia e server.
