import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Code Pairs',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'difficulty',
    title: 'Choose difficulty · Code Pairs',
    loadComponent: () =>
      import('./features/difficulty/difficulty-selector.component').then(
        (m) => m.DifficultySelectorComponent,
      ),
  },
  {
    path: 'play',
    title: 'Playing · Code Pairs',
    loadComponent: () =>
      import('./features/game/game.component').then((m) => m.GameComponent),
  },
  { path: '**', redirectTo: '' },
];
