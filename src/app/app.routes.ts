import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'difficulty',
    loadComponent: () =>
      import('./features/difficulty/difficulty-selector.component').then(
        (m) => m.DifficultySelectorComponent,
      ),
  },
  {
    path: 'play',
    loadComponent: () =>
      import('./features/game/game.component').then((m) => m.GameComponent),
  },
  { path: '**', redirectTo: '' },
];
