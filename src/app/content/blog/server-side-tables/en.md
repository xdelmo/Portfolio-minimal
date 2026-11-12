---
title: Ten records is easy, ten thousand is engineering
description: Server-side pagination, sorting and filters for PrimeNG tables, with one TablePaginationState class and the bridge between Signals and RxJS.
date: 2026-10-11
project: apexflow
---
During my early weeks at IPS, I tackled a classic enterprise frontend challenge: managing large-scale data tables with pagination, sorting, and filtering delegated entirely to the server. When rendering ten records, you can comfortably fetch the entire payload and sort it in browser memory. With ten thousand records, that approach breaks down: the server must slice and index the dataset, while the frontend must reliably request only the currently visible slice.

I brought this architectural lesson directly into ApexFlow. Customer, order, and product lists are all PrimeNG tables in lazy-loading mode, and my priority was to eliminate the antipattern where every user interaction triggers an imperative `loadData()` method.

## The state matrix of an enterprise table

A server-side table coordinates more interconnected state than it might appear:
- Active page index (`currentPage`) and batch size (`pageSize`).
- Sort field and direction (`sortField`, `sortOrder`).
- Column filters and global search queries (`filters`, `query`).

When these parameters are scattered across isolated component properties, user interactions (column header clicks, filter debounces, page jumps) easily construct partial requests, dropping parameters or introducing race conditions.

## Reactive encapsulation: TablePaginationState

In ApexFlow, I isolated the entire table lifecycle inside `TablePaginationState`. Each navigation parameter is a discrete `signal`, and a single derived `computed` value generates the HTTP parameters configuration object:

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

PrimeNG emits user interaction events through a consolidated `TableLazyLoadEvent`. The state class normalizes this payload and updates internal signals only when values actually change (filters undergo a deep equality check). As a result, redundant clicks never dispatch unnecessary network traffic.

## From state to network: the Signals-RxJS bridge

The component converts the computed `params` into an observable stream, delegates asynchronous request handling to RxJS, and pipes the final response back into a signal for the template:

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

This architecture solves three critical concerns cleanly:
1. **Zero race conditions:** `switchMap` automatically cancels any in-flight HTTP request if the user navigates to another page or updates a filter. A delayed response from page 2 can never overwrite page 3.
2. **Clean subscription lifecycle:** `toSignal` handles subscription management behind the scenes and tears it down when the component unmounts, removing manual `subscribe()` and `unsubscribe()` boilerplate.
3. **Backend decoupling:** The HTTP parameters represent the only contract between client and server. During initial development, the frontend worked against a mock JSON Server with custom middleware; transitioning to production Spring Boot APIs required changes only in the service layer, leaving table components completely untouched.

## The result

Every table in ApexFlow reuses this exact `TablePaginationState` pattern. Component code remains purely declarative: it defines what to display and how to map data, letting the reactive system guarantee synchronization between UI and server.
