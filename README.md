# Code Pairs: An Angular Memory Game
## Debugging your Memory
This project is a code-themed "concentration" or memory-matching game built with Angular. It demonstrates core framework concepts including component architecture, state management via services, and routing. Players flip cards to find matching pairs, with their score and remaining attempts tracked by the UI.


## ✨ Features
- Component-Based: Fully built using Angular components for the home screen, difficulty selector, and game board.
- Centralized State Management: Core game logic, card state, and player stats are managed in a single GamelogicService.
- RxJS Subscriptions: The SandBoxComponent subscribes to Observables (cards$, currentPlayer$, lockBoard$) from the service to update the UI in real-time.
- Dynamic UI: Player score and attempts remaining are dynamically rendered.
- CSS 3D Animations: Cards feature a smooth 3D flip animation using CSS perspective, transform, and transition properties.
- Game Controls: Includes logic for handling card clicks and a "Reset Game" button.

## 🚀 Getting Started
Follow these instructions to get a copy of the project up and running on your local machine.

## Prerequisites
You must have Node.js and the Angular CLI installed on your machine.

Bash

### Install the Angular CLI globally (if you don't have it)
npm install -g @angular/cli
Installation & Running
Clone the repository:

```Bash
git clone https://github.com/your-username/your-repo-name.git
```
Navigate to the project directory:
```Bash
cd your-repo-name
Install NPM packages:
```
```Bash
npm install
```
Run the development server:
```Bash
ng serve --open
```
This will open the application in your default browser at http://localhost:4200/.

#  📁 Project Structure

```
src/app/
├── home/                 # The landing page component
├── difficulty-selector/  # Difficulty selection screen
│   ├── difficulty-selector.component.ts
│   └── ...
├── sand-box/             # The main game board component
│   ├── sand-box.component.ts
│   └── ...
└── gamelogic.service.ts  # Manages all game state and logic
```

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.5.
## Development server
To start a local development server, run:

```bash
ng serve
```
Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Building
To build the project run:

```bash
ng build
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
