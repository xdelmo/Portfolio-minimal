---
title: Why Spring Boot when I already knew TypeScript?
description: A senior backend friend asked why my thesis paired Angular with Java instead of NestJS. Here is what drove the choice and what it cost.
date: 2026-03-19
linkedin: https://www.linkedin.com/feed/update/urn:li:activity:7440413562331860992/
project: apexflow
---
“Why learn Java and Spring Boot from scratch if you already master the TypeScript ecosystem?”

A senior backend engineer posed this question during an informal review of ApexFlow’s architecture. I was outlining my technical stack: Angular 19 with Signals on the client, Spring Boot 4 on Java 21 on the server. His point was pragmatic: with NestJS, I would have maintained a single unified language, sharing type models, tooling, and lint configurations end to end.

It was a fair question, and answering it forced me to separate convenience from what I actually wanted to learn.

## The immediate appeal of NestJS

NestJS was unequivocally the lower-friction path for a solo engineer:
- **Language uniformity:** TypeScript in both browser and runtime, minimizing context switching.
- **Shared typing:** The same `Customer` interface could seamlessly flow from database queries to presentation tables, eliminating redundant type declarations.
- **Familiar conventions:** Modules, decorators, and dependency injection in NestJS mirror Angular’s architecture, offering a virtually flat learning curve.

If the goal were purely initial delivery speed, NestJS would have been the obvious choice.

## Why I chose Spring Boot anyway

The first reason was the job market I was aiming for. Most Angular roles I read asked for Java and Spring Boot on the backend, and a thesis was the right place to learn the stack I expected to work with rather than the fastest one to wire up.

The second reason concerns **explicit architectural boundaries**.

When frontend and backend share a language and type repository, the risk of accidental coupling is high: persistence concerns and internal database structures easily bleed into client-facing UI components. With two distinct languages, the HTTP boundary has to be explicit.

On one side stand Spring Data JPA entities, repositories, and controllers:

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

On the other side reside TypeScript domain models, bridged solely via a JSON REST contract. Nothing carries over by import; every field returned to the client has to be declared on both sides of the API.

## The operational trade-offs

Building across heterogeneous stacks introduces real complexity:
- **Dual build and deployment chains:** Two distinct runtimes, two dependency managers (npm and Maven), two testing pipelines, and two separate hosting environments (Vercel for the static frontend, Render with PostgreSQL in Docker for the API).
- **Manual contract synchronization:** Updating a property in a Java entity requires an explicit, synchronized update in TypeScript types. In an enterprise team, adopting a contract-first approach with OpenAPI client code generation would be the natural next step.
- **Steeper initial setup:** Configuring dependency injection beans, route security, CORS filters, and JPA entities demands a significantly higher initial investment than a quick Node.js setup.

## What I took from it

For a startup or agile product team prioritizing rapid iteration speed, NestJS remains a compelling choice.

Building ApexFlow with Spring Boot 4 paid off because it showed me from the other side what a frontend can reasonably ask of an API and what belongs in the UI.
