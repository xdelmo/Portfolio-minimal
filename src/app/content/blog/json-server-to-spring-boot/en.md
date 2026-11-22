---
title: A Spring Boot API that speaks json-server
description: How I built the ApexFlow backend in Spring Boot and Java 21 so the Angular dashboard could switch from a mock server to a real API without changing a line.
date: 2026-11-22
project: apexflow
---
The ApexFlow dashboard was born against json-server: a `db.json` file and a fake REST API in one command. It let me build the tables, the filters and the forms before a real backend existed. The price is a contract: the frontend learns json-server’s dialect, `_page`, `_limit`, `_sort`, `name_like`, the total in an `X-Total-Count` header.

When the time came for the real backend, I set myself one rule: the frontend does not change. Switching from the mock to Spring Boot had to be a matter of configuration, `npm run start:springboot` instead of `npm start`. This post is about what that rule asked of the backend.

## The stack

Spring Boot 4 on Java 21, Spring Data JPA on PostgreSQL, Maven, a Docker image on Eclipse Temurin. Five resources (customers, orders, products, users, customer statistics), each with a controller, a service and a repository.

## One parser for every list

Every list endpoint takes all its query parameters as a map and hands them to one utility class, `QueryFilterParser`. It turns the map into the two things Spring Data understands: a `Pageable` for page, size and sort, and a `Specification` for the filters.

```java
@GetMapping
public ResponseEntity<List<Customer>> getCustomers(@RequestParam Map<String, String> allParams) {
  Page<Customer> page = customerService.getCustomers(allParams);
  HttpHeaders headers = new HttpHeaders();
  headers.set("X-Total-Count", String.valueOf(page.getTotalElements()));
  return ResponseEntity.ok().headers(headers).body(page.getContent());
}
```

The body is a plain array, as json-server returns it, and the total travels in the header the PrimeNG paginator already reads. The rules of the dialect live in one place:

- `_page` is 1-based, as the frontend sends it, and becomes Spring’s 0-based page.
- A key ending in `_like` becomes a case-insensitive `LIKE '%value%'` on that field.
- Any other key that names a field of the entity becomes an exact match; a key that names no field is ignored instead of failing the request.

So the five list endpoints behave the same way. A new dashboard filter on a field the entity already has needs no server code.

## Where the dialect ran out

json-server can filter on a related record, such as orders by customer name, because everything sits in one JSON file. In a relational database an order holds only the customer’s id. For `customer.name_like` the order service first finds the matching customers, then filters the orders by their ids:

```java
List<String> customerIds = customerRepository.findAll((root, query, cb) ->
    cb.like(cb.lower(root.get("name")), "%" + nameQuery + "%")
).stream().map(Customer::getId).toList();

spec = spec.and((root, query, cb) ->
    customerIds.isEmpty() ? cb.disjunction() : root.get("customerId").in(customerIds));
```

`_expand=customer`, which json-server uses to embed the customer in each order, works the same way: the page of orders first, then one `findAllById` for all their customers, joined through a map in memory. The customers cost one query per page, never one per row.

## Business rules json-server could not have

The mock could only store what it was sent. The real backend is where the rules of the domain went:

- **An order extends a subscription.** Creating an order with monthly or yearly products adds the months to the customer’s end date, from today or from a date still in the future, and marks the customer active. In the same transaction it updates the customer’s totals: number of orders, revenue, date of the last order.
- **Subscriptions expire on their own.** A `@Scheduled` job runs every night at 1:00, and once at startup, and marks as expired every active customer whose end date has passed.
- **Errors have one shape.** A `@RestControllerAdvice` turns validation errors and bad arguments into a 400 with a fixed JSON body, and any unexpected exception into a 500 with a generic message. The stack trace stays in the log.

## What I would change

Three things I would do differently:

- **Sorting on a related field.** The parser ignores `_sort=customerStats.totalRevenue`; the customer service handles that case on its own, sorting and paging in memory. A join in the `Specification` would bring it back to the shared code.
- **Totals in the database.** Total and monthly revenue load every order and sum them in Java. With seven orders it does not matter; with seventy thousand it would be a `SUM` with `GROUP BY` month in a repository query.
- **Server-made ids.** Order ids come from a random four-digit number, fine for a demo; in production, sooner or later, two orders would get the same id. A sequence or a UUID removes the problem.

## What the rule gave me

The rule “the frontend does not change” kept the contract in one place, a parser and a header, and made the switch from mock to real API a non-event. It also showed me the limit of starting from a mock: json-server decided the shape of the API. Some of its conveniences, such as filters on related records, are harder in SQL than they look in a JSON file. The code is on GitHub, in [xdelmo/backend-tesi](https://github.com/xdelmo/backend-tesi).
