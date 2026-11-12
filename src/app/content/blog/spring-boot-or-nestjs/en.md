---
title: Why Spring Boot when I already knew TypeScript?
description: A senior backend friend asked why my thesis paired Angular with Java instead of NestJS. What drove the choice, what it cost, and what I think now.
date: 2026-03-19
project: apexflow
---
"Why learn Java and Spring Boot from scratch if you already master the TypeScript ecosystem?"

A senior backend engineer posed this question during an informal review of ApexFlow's architecture. I was outlining my technical stack: Angular 19 with Signals on the client, Spring Boot 3 on Java 21 on the server. His point was pragmatic: with NestJS, I would have maintained a single unified language, sharing type models, tooling, and lint configurations end to end.

It was a completely legitimate question. It challenged me to articulate the core trade-offs behind a stack choice deliberately geared toward enterprise software engineering.

## The immediate appeal of NestJS

NestJS was unequivocally the lower-friction path for a solo engineer:
- **Language uniformity:** TypeScript in both browser and runtime, minimizing context switching.
- **Shared typing:** The same `Customer` interface could seamlessly flow from database queries to presentation tables, eliminating redundant type declarations.
- **Familiar conventions:** Modules, decorators, and dependency injection in NestJS mirror Angular's architecture, offering a virtually flat learning curve.

If the goal were purely initial delivery speed, NestJS would have been the obvious choice.

## Why I chose Spring Boot anyway

The primary driver was enterprise market reality. Java and the Spring ecosystem power mission-critical software across global industry, and it is the backend pair that appears most frequently alongside Angular in large engineering organizations. An engineering thesis is an ideal opportunity to invest in the architectural patterns one will actually navigate in production, rather than optimizing for shortcuts.

The second reason—and perhaps the most impactful in terms of software design—concerns **explicit architectural boundaries**.

When frontend and backend share a language and type repository, the risk of accidental coupling is high: persistence concerns and internal database structures easily bleed into client-facing UI components. With two distinct ecosystems, the HTTP boundary is inevitably strict, deliberate, and formal.

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

On the other side reside TypeScript domain models, bridged solely via a JSON REST contract. Nothing is inherited implicitly: every field exposed to the client represents a conscious interface decision.

## The operational trade-offs

Building across heterogeneous stacks introduces real complexity:
- **Dual build and deployment chains:** Two distinct runtimes, two dependency managers (npm and Maven), two testing pipelines, and two separate hosting environments (Vercel for the static frontend, Render with PostgreSQL in Docker for the API).
- **Manual contract synchronization:** Updating a property in a Java entity requires an explicit, synchronized update in TypeScript types. In an enterprise team, adopting a contract-first approach with OpenAPI client code generation would be the natural next step.
- **Steeper initial setup:** Configuring dependency injection beans, route security, CORS filters, and JPA entities demands a significantly higher initial investment than a quick Node.js setup.

## The architectural takeaway

For a startup or agile product team prioritizing rapid iteration speed, NestJS remains a compelling choice.

For me, building ApexFlow with Spring Boot 3 was the most valuable investment I could have made. It deepened my appreciation of backend system responsibilities, teaching me precisely what an enterprise frontend engineer can expect from an API—and what logic belongs firmly within the client interface.
