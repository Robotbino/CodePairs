import {
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
} from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Preload every lazy screen after first paint, so tapping Play or a
    // level never waits on a network fetch with no feedback.
    provideRouter(
      routes,
      withComponentInputBinding(),
      withPreloading(PreloadAllModules),
    ),
    provideAnimations(),
  ],
};
