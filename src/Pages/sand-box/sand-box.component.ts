import { GamelogicService } from './../../app/gamelogic.service';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
/* Adding an interface because making the Card object object type any
defeats the entire point of using Typescript */
interface Card{
  id:number;
  isFlipped:boolean;
  backside:string;
  matchId:string;
  source?:any;
}
interface Stats{
  score: number;
  rank: string;
  attemptsRemaining: number;
  matchesMade: number;
}/**
 * SandBoxComponent - The main component for our memory card game
 * 
 * This component handles:
 * - Displaying the game board
 * - Showing player stats
 * - Connecting user interactions to the game service
 */
@Component({
  selector: 'app-sand-box',
  standalone: false,
  templateUrl: './sand-box.component.html',
  styleUrl: './sand-box.component.css'
})
export class SandBoxComponent implements OnInit {
  // Local copies of game state that we use in our template
  cards: Card[] = [];
  currentPlayer!: Stats;
  lockBoard = false;

  /**
   * Constructor - inject our game service
   */
  constructor(private gameService: GamelogicService) {}

  /**
   * Initialize component when it's created
   * 
   * This method:
   * 1. Starts the game 
   * 2. Sets up listeners for game state changes
   */
  ngOnInit() {
    // Start a new game
    this.gameService.initializeGame();
    
    // ===== LISTEN FOR CHANGES =====
    // When cards change in the service, update our local copy
    this.gameService.cards$.subscribe(updatedCards => {
      this.cards = updatedCards;
    });
    
    // When current player changes in the service, update our local copy
    this.gameService.currentPlayer$.subscribe(updatedPlayer => {
      if (updatedPlayer) {
        this.currentPlayer = updatedPlayer;
      }
    });
    
    // When board lock status changes, update our local copy
    this.gameService.lockBoard$.subscribe(isLocked => {
      this.lockBoard = isLocked;
    });
    
    // Log card information (useful for debugging)
    this.showFunctions();
  }

  /**
   * Handle when a user clicks on a card
   * 
   * We simply pass the event to our game service
   * which contains all the actual game logic
   * 
   * @param card The card that was clicked
   */
  handleCardClick(card: Card) {
    this.gameService.handleCardClick(card);
  }

  /**
   * Display debug information about our cards
   */
  showFunctions() {
    this.gameService.logCardInfo();
  }

  /**
   * Reset the game to its initial state
   * 
   * Called when the reset button is clicked
   */
  resetGame() {
    this.gameService.resetGame();
  }
}
