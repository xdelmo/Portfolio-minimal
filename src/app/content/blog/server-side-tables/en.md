---
title: Ten records is easy, ten thousand is engineering
description: Server-side pagination, sorting and filters for PrimeNG tables, with one TablePaginationState class and the bridge between Signals and RxJS.
date: 2026-10-11
project: apexflow
---
In my first weeks as an intern at IPS I met one of the most common, and most underestimated, problems of enterprise frontends: data tables with pagination and filters done on the server. With ten records you load everything and filter in the browser. With ten thousand you cannot: the server pages, sorts and filters, and the frontend has to ask for exactly the right slice every time something changes.

I took that experience straight into my thesis, ApexFlow. Its customers, orders and products are PrimeNG tables in lazy mode, and I wanted to leave behind the approach where every change calls a `load()` method by hand.

## What has to stay consistent

A server-side table has more state than it looks: the current page, the page size, the sort field and direction, the filters of each column, a free-text search. Change any of them and the table must make one request, with all of them, and ignore the answer to any request it has made since. Spread that over a component and you get a `load()` called from six places, each one able to forget a parameter.

## One class for the state

`TablePaginationState` holds every piece in a signal, and one `computed` turns them into the query parameters the API expects:

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

PrimeNG reports every page change, sort and column filter in one `TableLazyLoadEvent`. The class translates it, and it only sets a signal when its value really changed (filters are compared deeply), so a click that changes nothing makes no request.

## From state to requests, with no subscribe

The component turns `params` into an observable, lets RxJS do what it is good at, and turns the result back into a signal for the template:

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

`toObservable` emits whenever any parameter changes, once per change. `switchMap` cancels the request still in flight when a newer one starts, so a slow page 2 never overwrites page 3. `toSignal` subscribes for the component and unsubscribes when it is destroyed.

## The result

1. **Predictable state.** Every table has the same handful of signals, and the parameters of a request are a function of them: nothing can drift apart.
2. **Clean components.** A component declares its table and what to fetch. It never calls `subscribe()` or `load()`, so it has no subscription to destroy.
3. **A realistic integration.** The frontend really delegates paging and filtering to the server. While the Spring Boot API was being built, a JSON Server with a small custom middleware stood in for it; the parameters are the only contract, so switching backend touches the service, not the tables.

Every table in ApexFlow reuses the same class.
