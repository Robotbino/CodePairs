# Code Pairs: An Angular Memory Game
### Debugging your Memory
This project is a code-themed "concentration" or memory-matching game built with Angular. It demonstrates core framework concepts including component architecture, state management via services, and routing. Players flip cards to find matching pairs, with their score and remaining attempts tracked by the UI.


# ✨ Features
- Component-Based: Fully built using Angular components for the home screen, difficulty selector, and game board.
- Centralized State Management: Core game logic, card state, and player stats are managed in a single GamelogicService.
- RxJS Subscriptions: The SandBoxComponent subscribes to Observables (cards$, currentPlayer$, lockBoard$) from the service to update the UI in real-time.
- Dynamic UI: Player score and attempts remaining are dynamically rendered.
- CSS 3D Animations: Cards feature a smooth 3D flip animation using CSS perspective, transform, and transition properties.
- Game Controls: Includes logic for handling card clicks and a "Reset Game" button.

# 🚀 Getting Started
Follow these instructions to get a copy of the project up and running on your local machine.

#### Prerequisites
You only need to have Node.js and the Angular CLI installed on your machine.

# 📁 Project Structure
src/app/
├── home/                 # The landing page component
├── difficulty-selector/  # Difficulty selection screen
│   ├── difficulty-selector.component.ts
│   └── ...
├── sand-box/             # The main game board component
│   ├── sand-box.component.ts
│   └── ...
└── gamelogic.service.ts  # (Inferred) Manages all game state and logic
This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.5.
## Development server
To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
