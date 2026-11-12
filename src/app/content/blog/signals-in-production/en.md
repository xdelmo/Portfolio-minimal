---
title: Signals in a real app: the ApexFlow auth module
description: How the authentication state of my thesis project moved to Angular Signals, what that removed from the code, and where RxJS still belongs.
date: 2026-01-28
project: apexflow
---
When I designed the architecture for ApexFlow, building it around Angular 19 and Signals was a calculated technical bet. Signals had just reached stability, most tutorials still defaulted to `BehaviorSubject` for everything, and I was setting out to build an enterprise CRM dashboard with varied data flows and role-based permissions. Looking back, it was the soundest architectural choice in the entire project.

The clearest proof point was the authentication module: the critical slice of state that every route guard, navigation bar, and user view depends on.

## The problem: shared state without race conditions

An authentication service continually answers three essential questions: is someone logged in? Who are they? What permissions do they have? The header, sidebar, route guards, and most pages require these answers synchronously and immediately.

The traditional Angular approach involves a primary `BehaviorSubject` for the user, derived observables for roles, and manual subscriptions across components managed with `takeUntil` or the `async` pipe. It works, but it scatters state across multiple streams that must remain synchronized over time. Every new consumer introduces the potential for leaked subscriptions or subtle timing mismatches.

## Two signals and synchronous derivation

In ApexFlow, the service centralizes state in just two signals, initialized synchronously from local storage when the application boots:

```ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  isLoggedIn = signal<boolean>(this.hasToken());
  currentUser = signal<User | null>(this.getUserFromStorage());

  isAdmin(): boolean {
    const user = this.currentUser();
    return user?.role === UserRole.Admin;
  }
}
```

From there, consuming state becomes a direct synchronous read. In templates, `auth.currentUser()?.name` registers a fine-grained dependency for that specific view slice. In route guards, authorization checks are completely synchronous—no observable streams to await, no emission delays, and no teardown logic:

```ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};
```

Logging in and out reduce to direct `.set()` calls. Dependent components update automatically through Angular's fine-grained reactivity, without manual notification dispatches or re-evaluating the entire component tree.

## What disappears from the codebase

- **Manual subscriptions.** No component opens a stream to track authentication: no `ngOnDestroy` cleanup boilerplate, and zero memory leaks when navigating across complex screens.
- **Timing and order bugs.** A signal always holds an immediate value. A route guard never executes before an initial subject emission because there is no stream to wait for.
- **Debugging guesswork.** State is a tangible value at a point in time, not an ephemeral stream: you can place a breakpoint anywhere and inspect it directly without injecting temporary `tap()` operators.

## Where RxJS remains indispensable

Signals do not replace RxJS; they clarify its boundaries. The rule I established in ApexFlow is simple: **Signals govern synchronous present state; RxJS handles asynchronous events over time**.

The login HTTP request remains an `Observable`, as do debounced search inputs and cancellation pipelines where a newer query must abort an in-flight request. The two paradigms integrate cleanly via `toSignal` and `toObservable`, which form the backbone of our server-side data tables.

## The architectural takeaway

Starting directly with Signals allows code to describe *what the application is at any given moment*, rather than maintaining a chain of imperative-reactive commands to keep it in sync. RxJS returns to what it excels at: orchestrating time, events, and asynchronous concurrency.
