/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// a task of its own: evaluating the modules and bootstrapping in one were a single long task (issue #151)
setTimeout(() => {
  bootstrapApplication(App, appConfig).catch((err: unknown) => {
    console.error(err);
  });
});
