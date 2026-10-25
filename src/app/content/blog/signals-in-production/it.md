---
title: Signals in un'app vera: il modulo di autenticazione di ApexFlow
description: Come lo stato di autenticazione del mio progetto di tesi è passato ai Signals di Angular, cosa ha tolto dal codice e dove RxJS resta lo strumento giusto.
date: 2026-10-11
project: apexflow
---
Quando ho iniziato la tesi su ApexFlow, costruirla su Angular 19 e i Signals sembrava un azzardo. I Signals erano appena diventati stabili, quasi tutti i tutorial usavano ancora `BehaviorSubject` per tutto e io ci stavo per costruire sopra una dashboard CRM. Ripensandoci, è la scelta di cui sono più contento.

L'esempio più chiaro è il modulo di autenticazione: lo stato da cui dipende tutto il resto dell'app.

## Il problema: uno stato da tenere sincronizzato

Un servizio di autenticazione risponde di continuo a poche domande. C'è qualcuno loggato? Chi? È un amministratore? Se lo chiedono l'header, la sidebar, le guard delle rotte e metà delle pagine.

La risposta classica è un `BehaviorSubject` per l'utente, un observable per ogni domanda derivata e un `subscribe()` in ogni componente che ne ha bisogno, più il `takeUntil` o la pipe `async` che fa pulizia. Funziona, ma lo stato finisce sparso in tanti flussi che *speri* restino sincronizzati, e ogni nuovo consumatore è un'altra sottoscrizione da gestire bene.

## Due signal e una domanda derivata

In ApexFlow il servizio tiene due signal, letti una volta dallo storage all'avvio dell'app:

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

Tutto il resto è una lettura. Un template scrive `auth.currentUser()?.name` e Angular sa che quella vista dipende dall'utente. Una guard legge il valore in modo sincrono, senza flussi da aspettare né niente da cui disiscriversi:

```ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};
```

Login e logout sono due chiamate a `set()`. Ogni vista che legge l'utente si aggiorna da sola, e non bisogna avvisare nessuno.

## Cosa è sparito

- **Le sottoscrizioni manuali.** Nessun `subscribe()` nei componenti per seguire lo stato di autenticazione: niente `ngOnDestroy`, niente `takeUntil`, nessun leak da cercare quando si lascia una pagina.
- **I bug di ordine.** Un signal ha sempre un valore. Una guard non gira mai prima della prima emissione, perché una prima emissione non c'è.
- **Le ipotesi nel debugger.** Lo stato è un valore: metti un breakpoint ovunque e lo leggi, invece di aggiungere un `tap` per vedere cosa è passato.

## Dove resta RxJS

In ApexFlow i Signals non hanno sostituito RxJS, gli hanno dato un compito più preciso. Il tempo resta a RxJS: la chiamata HTTP del login è un `Observable`, e lo sono le ricerche con debounce e le richieste che devono annullare quella prima. I signal tengono *ciò che è vero adesso*; gli observable descrivono *ciò che succede nel tempo*. I due si incontrano con `toSignal` e `toObservable`, che ho usato per le tabelle lato server (il prossimo articolo).

## Lo rifarei?

Sì, e dal primo commit. Se oggi inizi un progetto Angular, metti lo stato nei signal e tieni RxJS per gli eventi e il lavoro asincrono per cui è nato. Il codice si legge come una descrizione dello stato, non come una serie di istruzioni per tenerlo coerente, ed era soprattutto questo che cercavo.
