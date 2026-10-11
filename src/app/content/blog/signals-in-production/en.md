---
title: Signals in production: the ApexFlow auth module
description: How the authentication state of my thesis project moved to Angular Signals, what that removed from the code, and where RxJS still belongs.
date: 2026-10-11
project: apexflow
---
When I started my thesis on ApexFlow, building it on Angular 19 and Signals felt like a gamble. Signals had only just become stable, most tutorials still used `BehaviorSubject` for everything, and I was about to build a CRM dashboard on top of them. Well into the project, it is the decision I am happiest with.

The clearest example is the authentication module: the piece of state every other part of the app depends on.

## The problem: state that has to stay in sync

An auth service answers a few questions all the time. Is someone logged in? Who? Are they an admin? The header, the sidebar, the route guards and half of the pages ask them.

The classic answer is a `BehaviorSubject` for the user, an observable for each question derived from it, and a `subscribe()` in every component that needs one, plus the `takeUntil` or `async` pipe that cleans up after it. It works, but the state ends up spread over a set of streams you *hope* stay in sync, and every new consumer is one more subscription to get right.

## Two signals and a derived question

In ApexFlow the service keeps two signals, read once from storage when the app starts:

```ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  isLoggedIn = signal<boolean>(this.hasToken());
  currentUser = signal<User | null>(this.getUserFromStorage());

  isAdmin(): boolean {
    return this.currentUser()?.role === UserRole.Admin;
  }
}
```

Everything else is a read. A template writes `auth.currentUser()?.name` and Angular knows that view depends on it. A guard reads the value synchronously, with no stream to wait for and nothing to unsubscribe from:

```ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};
```

Logging in and out are just two `set()` calls. Every view that reads the user updates itself, and nothing has to be told.

## What disappeared

- **Manual subscriptions.** Not one `subscribe()` in a component to follow the auth state, so no `ngOnDestroy`, no `takeUntil`, no leak to hunt when a page is left.
- **Order bugs.** A signal always has a value. A guard never runs before the first emission, because there is no first emission.
- **Guessing in the debugger.** The state is a value: put a breakpoint anywhere and read it, instead of tapping a pipe to see what went through it.

## Where RxJS stays

Signals did not replace RxJS in ApexFlow, they gave it a narrower job. Time is still RxJS: the HTTP call that logs in is an `Observable`, and so are debounced search boxes and requests that must cancel the one before them. Signals hold *what is true now*; observables describe *what happens over time*. The two meet through `toSignal` and `toObservable`, which I used for the server-side tables (the next post).

## Would I do it again?

Yes, and from the first commit. If you are starting a new Angular project today, put its state in signals and keep RxJS for the events and the async work it was made for. The code reads like a description of the state rather than a set of instructions for keeping it consistent, and that is most of what I wanted from it.
