---
title: Signals in un'app vera: il modulo di autenticazione di ApexFlow
description: Come lo stato di autenticazione del mio progetto di tesi è passato ai Signals di Angular, cosa ha tolto dal codice e dove RxJS resta lo strumento giusto.
date: 2026-01-28
linkedin: https://www.linkedin.com/feed/update/urn:li:activity:7422344320042594307/
project: apexflow
---
Quando ho impostato l'architettura di ApexFlow, costruirla su Angular 19 e sui Signals era una scommessa tecnica. I Signals erano appena diventati stabili, la maggior parte dei tutorial continuava a usare `BehaviorSubject` per qualsiasi cosa e io stavo progettando una dashboard CRM con dati eterogenei e permessi granulari. Ripensandoci, è stata la scelta architetturale più solida dell'intero progetto.

Il banco di prova più netto è stato il modulo di autenticazione: lo stato critico da cui dipende ogni rotta, sidebar e dato utente dell'applicazione.

## Il problema: uno stato condiviso senza corse critiche

Un servizio di autenticazione risponde costantemente a tre domande fondamentali: c'è un utente autenticato? Chi è? Quali permessi possiede? L'header, la sidebar, le route guard e la maggior parte delle schermate hanno bisogno di queste risposte all'istante.

L'approccio convenzionale in Angular prevede un `BehaviorSubject` principale per l'utente, una serie di observable derivati e sottoscrizioni manuali nei componenti, gestite tramite `takeUntil` o la pipe `async`. Funziona, ma frammenta lo stato in flussi multipli che devono rimanere sincronizzati nel tempo. Ogni nuovo componente consumatore introduce il rischio di un `subscribe()` non ripulito o di disallineamenti di fase.

## Due signal e derivazione sincrona

In ApexFlow il servizio centralizza lo stato in due soli signal, inizializzati in modo sincrono dallo storage locale all'avvio dell'applicazione:

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

Da quel momento, consumare lo stato diventa una lettura diretta. Nel template, `auth.currentUser()?.name` registra automaticamente la dipendenza di rendering per quel solo frammento di vista. Nelle guard di routing, la decisione è puramente sincrona: nessun observable da attendere, nessun ritardo di emissione e nessun rischio di memory leak:

```ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};
```

Login e logout si riducono a chiamate dirette a `.set()`. I componenti dipendenti si aggiornano automaticamente grazie alla reattività a grana fine di Angular, senza bisogno di notifiche manuali o di re-triggering dell'intero albero di viste.

## Cosa scompare dal codice

- **Le sottoscrizioni manuali.** Nessun componente apre un flusso per monitorare la sessione: niente boilerplate di teardown in `ngOnDestroy`, zero memory leak quando l'utente naviga tra pagine complesse.
- **I problemi di timing e race condition.** Un signal contiene sempre un valore sincronizzato. Una route guard non rischia mai di essere valutata prima dell'emissione iniziale del subject.
- **La complessità nel debugging.** Lo stato è un valore puntuale, non un flusso temporale: basta un breakpoint per leggerne il contenuto esatto in qualsiasi momento, senza dover inserire operatori `tap()` per tracciare cosa sta transitando.

## Dove RxJS resta indispensabile

I Signals non sostituiscono RxJS; ne chiariscono i confini. La regola che ho adottato in ApexFlow è semplice: **i Signals governano lo stato sincrono presente, RxJS gestisce gli eventi asincroni nel tempo**.

La chiamata HTTP di login rimane un `Observable`, così come le ricerche con debounce e le richieste che devono annullare quelle precedenti. I due mondi comunicano in modo pulito tramite le primitive di interop `toSignal` e `toObservable`, fondamentali per la gestione delle tabelle lato server.

## La conclusione architetturale

Iniziare direttamente con i Signals permette al codice di descrivere *cosa l'applicazione è in un determinato momento*, anziché una catena di istruzioni imperativo-reattive per mantenerla coerente. RxJS torna al suo ruolo ideale: orchestrare il tempo e la concorrenza asincrona.
