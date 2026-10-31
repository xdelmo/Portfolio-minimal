---
title: Why Spring Boot when I already knew TypeScript?
description: A senior backend friend asked why my thesis paired Angular with Java instead of NestJS. What drove the choice, what it cost, and what I think now.
date: 2026-10-11
project: apexflow
---
"Why learn Java and Spring Boot if you already know TypeScript?"

A friend who works as a senior backend developer asked me that while I was studying NgRx for my thesis and wanted his opinion on the architecture. I told him the stack: Angular 19 and Signals on the client, Spring Boot 3 on Java 21 on the server. His reaction: "Why make life hard with Java? You know TypeScript, you could have used NestJS and kept everything in JS and TS."

It is a fair question, and it made me think it through properly.

## The case for NestJS

NestJS would have been the comfortable choice, and not only because of the language:

- **One language end to end.** The same TypeScript in the browser and on the server, the same tooling, the same lint rules.
- **Shared types.** The `Customer` interface the tables render could have been the exact type the API returns, with no hand-kept copy on either side.
- **A familiar shape.** Modules, decorators and dependency injection: NestJS is openly modelled on Angular, so the backend would have looked like the frontend.

For a solo project, that is a lot of friction removed.

## Why I chose Spring Boot anyway

The reason was the market. Java and Spring Boot run a large share of enterprise backends, and it is the stack most of the job posts I read asked for next to Angular. A thesis is the one project where I choose the stack to learn, not to ship fast, so I chose the one I would meet at work.

There was a second reason I only saw later: with two languages, the contract between client and server has to be explicit. In ApexFlow it is. Spring Data JPA entities and repositories on one side:

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

TypeScript models on the other, and HTTP in between. Nothing is shared by accident, so every field the frontend relies on is a decision.

## What it cost

- **Two of everything.** Two languages, two build tools (npm and Maven), two test setups, two deploys: the frontend on Vercel, the API on Render with PostgreSQL in Docker.
- **Types written twice.** A field renamed in a Java entity is a broken table until the TypeScript model follows. Generating the client from an OpenAPI description is the fix I would add next.
- **Slower start.** The first weeks went into Spring itself (beans, JPA, CORS, Spring Security) rather than into features.

## What I think now

For a team that is all TypeScript and wants to move fast, NestJS is a sound choice and I would not argue against it. For me, at this point, Spring Boot was the better investment: it is what I am likely to find behind an enterprise Angular frontend, and building both sides taught me what a frontend can ask of a backend, and what it should not.

My friend's question is a good one to ask at the start of any project, and the answer depends on what the project is for.
