import { Injectable } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";

/**
 * Card interface - defines the structure of each card in our memory game
 */
export interface Card {
  id: number;           // Unique identifier for the card
  isFlipped: boolean;   // Whether the card is currently flipped face-up
  backside: string;     // URL to the back image of the card
  matchId: string;      // ID used to determine matching pairs (cards with same matchId are a match)
  source?: SafeHtml;    // The sanitized HTML content for the card's front face (SVG icon)
}

/**
 * Stats interface - defines the player statistics structure
 */
export interface Stats {
  score: number;              // Current player score
  rank: string;               // Player rank (Beginner, Intermediate, etc.)
  attemptsRemaining: number;  // How many wrong attempts the player has left
  matchesMade: number;        // How many matches the player has found
}

/**
 * GamelogicService - Handles all game logic for the memory card game
 * 
 * This service manages:
 * - Card creation and shuffling
 * 
 * - Game state (cards flipped, matches, score)
 * 
 * - Player statistics
 * 
 * - Game rules (attempts, matching logic)
 */
@Injectable({
  providedIn: 'root'
})
export class GamelogicService {
  //Game defaults to easy
  private selectedDifficulty: string = 'easy';
  // ===== GAME STATE PROPERTIES =====
  
  // Cards array - stores all the game cards
  private cards: Card[] = [];
  
  // Player stats array - typically this would just have one player for now
  private stats: Stats[] = [];
  
  // Reference to the current player's stats
  private currentPlayer!: Stats;
  
  // Flag to prevent clicking cards during animations/processing
  private lockBoard = false;
  
  // Array to track which cards are currently flipped
  private flippedCards: Card[] = [];
  
  // ===== COMMUNICATION WITH COMPONENT =====
  // These BehaviorSubjects allow us to notify the component when data changes
  
  // Simple explanation of BehaviorSubject:
  // - It's like a "broadcaster" that sends data to anyone who is listening
  // - Components can "tune in" to receive updates when data changes
  // - It also remembers the last value, so new subscribers get the most recent data immediately
  
  // Broadcaster for cards data changes
  private cardsSubject = new BehaviorSubject<Card[]>([]);
  // Broadcaster for stats data changes
  private statsSubject = new BehaviorSubject<Stats[]>([]);
  // Broadcaster for current player data changes
  private currentPlayerSubject = new BehaviorSubject<Stats | null>(null);
  // Broadcaster for lockBoard status changes
  private lockBoardSubject = new BehaviorSubject<boolean>(false);
  
  // Public streams that components can listen to (subscribe to)
  public cards$ = this.cardsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();
  public currentPlayer$ = this.currentPlayerSubject.asObservable();
  public lockBoard$ = this.lockBoardSubject.asObservable();

  // ===== CARD IMAGES =====
  // These are the SVG images we'll use for our cards
  private initialImages: { name: string, backside: string; source: string }[] = [
    {
      name: `chip`,
      backside: `/assets/CodePairs.png`,
      source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M176 24c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c-35.3 0-64 28.7-64 64l-40 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l40 0 0 56-40 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l40 0 0 56-40 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l40 0c0 35.3 28.7 64 64 64l0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40 56 0 0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40 56 0 0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40c35.3 0 64-28.7 64-64l40 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-40 0 0-56 40 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-40 0 0-56 40 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-40 0c0-35.3-28.7-64-64-64l0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40-56 0 0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40-56 0 0-40zM160 128l192 0c17.7 0 32 14.3 32 32l0 192c0 17.7-14.3 32-32 32l-192 0c-17.7 0-32-14.3-32-32l0-192c0-17.7 14.3-32 32-32zm192 32l-192 0 0 192 192 0 0-192z"/></svg>`
    },
    {
      name: `Memory`,
      backside: `/assets/CodePairs.png`,
      source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M64 64C28.7 64 0 92.7 0 128l0 7.4c0 6.8 4.4 12.6 10.1 16.3C23.3 160.3 32 175.1 32 192s-8.7 31.7-21.9 40.3C4.4 236 0 241.8 0 248.6L0 320l576 0 0-71.4c0-6.8-4.4-12.6-10.1-16.3C552.7 223.7 544 208.9 544 192s8.7-31.7 21.9-40.3c5.7-3.7 10.1-9.5 10.1-16.3l0-7.4c0-35.3-28.7-64-64-64L64 64zM576 352L0 352l0 64c0 17.7 14.3 32 32 32l48 0 0-32c0-8.8 7.2-16 16-16s16 7.2 16 16l0 32 96 0 0-32c0-8.8 7.2-16 16-16s16 7.2 16 16l0 32 96 0 0-32c0-8.8 7.2-16 16-16s16 7.2 16 16l0 32 96 0 0-32c0-8.8 7.2-16 16-16s16 7.2 16 16l0 32 48 0c17.7 0 32-14.3 32-32l0-64zM192 160l0 64c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32s32 14.3 32 32zm128 0l0 64c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32s32 14.3 32 32zm128 0l0 64c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32s32 14.3 32 32z"/></svg>`
    },
    {
      name: `Heart`,
      backside: `/assets/CodePairs.png`,
      source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></svg>`
    },
    
    {
      name: `Controller`,
      backside: `/assets/CodePairs.png`,
      source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M192 64C86 64 0 150 0 256S86 448 192 448l256 0c106 0 192-86 192-192s-86-192-192-192L192 64zM496 168a40 40 0 1 1 0 80 40 40 0 1 1 0-80zM392 304a40 40 0 1 1 80 0 40 40 0 1 1 -80 0zM168 200c0-13.3 10.7-24 24-24s24 10.7 24 24l0 32 32 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-32 0 0 32c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-32-32 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l32 0 0-32z"/></svg>`
    },
     {
      name: `Wand`,
      backside: `/assets/CodePairs.png`,
      source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M464 6.1c9.5-8.5 24-8.1 33 .9l8 8c9 9 9.4 23.5 .9 33l-85.8 95.9c-2.6 2.9-4.1 6.7-4.1 10.7l0 21.4c0 8.8-7.2 16-16 16l-15.8 0c-4.6 0-8.9 1.9-11.9 5.3L100.7 500.9C94.3 508 85.3 512 75.8 512c-8.8 0-17.3-3.5-23.5-9.8L9.7 459.7C3.5 453.4 0 445 0 436.2c0-9.5 4-18.5 11.1-24.8l111.6-99.8c3.4-3 5.3-7.4 5.3-11.9l0-27.6c0-8.8 7.2-16 16-16l34.6 0c3.9 0 7.7-1.5 10.7-4.1L464 6.1zM432 288c3.6 0 6.7 2.4 7.7 5.8l14.8 51.7 51.7 14.8c3.4 1 5.8 4.1 5.8 7.7s-2.4 6.7-5.8 7.7l-51.7 14.8-14.8 51.7c-1 3.4-4.1 5.8-7.7 5.8s-6.7-2.4-7.7-5.8l-14.8-51.7-51.7-14.8c-3.4-1-5.8-4.1-5.8-7.7s2.4-6.7 5.8-7.7l51.7-14.8 14.8-51.7c1-3.4 4.1-5.8 7.7-5.8zM87.7 69.8l14.8 51.7 51.7 14.8c3.4 1 5.8 4.1 5.8 7.7s-2.4 6.7-5.8 7.7l-51.7 14.8L87.7 218.2c-1 3.4-4.1 5.8-7.7 5.8s-6.7-2.4-7.7-5.8L57.5 166.5 5.8 151.7c-3.4-1-5.8-4.1-5.8-7.7s2.4-6.7 5.8-7.7l51.7-14.8L72.3 69.8c1-3.4 4.1-5.8 7.7-5.8s6.7 2.4 7.7 5.8zM208 0c3.7 0 6.9 2.5 7.8 6.1l6.8 27.3 27.3 6.8c3.6 .9 6.1 4.1 6.1 7.8s-2.5 6.9-6.1 7.8l-27.3 6.8-6.8 27.3c-.9 3.6-4.1 6.1-7.8 6.1s-6.9-2.5-7.8-6.1l-6.8-27.3-27.3-6.8c-3.6-.9-6.1-4.1-6.1-7.8s2.5-6.9 6.1-7.8l27.3-6.8 6.8-27.3c.9-3.6 4.1-6.1 7.8-6.1z"/></svg>`
    },
    {
      name: `Ghoul`,
      backside: `/assets/CodePairs.png`,
      source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M40.1 467.1l-11.2 9c-3.2 2.5-7.1 3.9-11.1 3.9C8 480 0 472 0 462.2L0 192C0 86 86 0 192 0S384 86 384 192l0 270.2c0 9.8-8 17.8-17.8 17.8c-4 0-7.9-1.4-11.1-3.9l-11.2-9c-13.4-10.7-32.8-9-44.1 3.9L269.3 506c-3.3 3.8-8.2 6-13.3 6s-9.9-2.2-13.3-6l-26.6-30.5c-12.7-14.6-35.4-14.6-48.2 0L141.3 506c-3.3 3.8-8.2 6-13.3 6s-9.9-2.2-13.3-6L84.2 471c-11.3-12.9-30.7-14.6-44.1-3.9zM160 192a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm96 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"/></svg>`
    }
  ];
 
  /**
   * Service constructor - We need the DomSanitizer to safely use SVG content in our cards
   */
  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Initialize the game state - Call this method when starting the game
   * 
   * This method:
   * 1. Creates the cards
   * 
   * 2. Sets up player stats
   * 
   * 3. Updates all listeners (components)
   */
  setDifficulty(level: string): void {
    this.selectedDifficulty = level;
    console.log('Difficulty set to:', this.selectedDifficulty);
  }

  initializeGame(): void {
    // Create all our cards
    this.initializeCards();

    // Create player stats
    this.loadPlayerStats();
    
    // Set current player to the first player in our stats array
    this.currentPlayer = this.stats[0];
    
    // Tell any listening components that data has changed
    this.notifyComponents();
  }

  /**
   * Create all the card objects for our game
   * 
   * Each card has:
   * - A unique id
   * - A flip state (initially false)
   * - A backside image
   * - A matchId (cards with same matchId are a match)
   * - A source (the SVG content for the front of the card)
   */
  private initializeCards(): void {
    // Create our array of cards
    // We're creating pairs of cards with the same matchId
    this.cards = [
      { 
        id: 1, 
        isFlipped: false, 
        backside: this.initialImages[0].backside, 
        matchId: 'A', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[0].source) 
      },
      { 
        id: 2, 
        isFlipped: false, 
        backside: this.initialImages[1].backside, 
        matchId: 'B', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[1].source) 
      },
      { 
        id: 3, 
        isFlipped: false, 
        backside: this.initialImages[2].backside, 
        matchId: 'A', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[2].source) 
      },
      { 
        id: 4, 
        isFlipped: false, 
        backside: this.initialImages[3].backside, 
        matchId: 'B', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[3].source) 
      },
      { 
        id: 5, 
        isFlipped: false, 
        backside: this.initialImages[4].backside, 
        matchId: 'B', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[3].source) 
      },
      { 
        id: 6, 
        isFlipped: false, 
        backside: this.initialImages[5].backside, 
        matchId: 'B', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[3].source) 
      }
    ];
    
    // Randomize the card positions
    this.shuffleCards();
  }

  /**
   * Create the player statistics
   * 
   * Sets up:
   * - Initial score (0)
   * - Starting rank ("Beginner")
   * - Number of attempts allowed (3)
   * - Number of matches made (0)
   */
  private loadPlayerStats(): void {
    this.stats = [
      {
        score: 0,
        rank: "Beginner",
        attemptsRemaining: 3,
        matchesMade: 0
      }
    ];
  }

  /**
   * Gets an icon by index from our images array
   * 
   * @param index The index of the icon to retrieve
   * @returns A data URL string representing the SVG icon
   */
  getInitialIcon(index: number): string {
    // Check if the index is valid
    if (index < this.initialImages.length) {
      return `data:image/svg+xml,${encodeURIComponent(this.initialImages[index].source)}`;
    }
    
    // If the index is invalid, return the first icon as a default
    console.log("Invalid icon index, using default");
    return `data:image/svg+xml,${encodeURIComponent(this.initialImages[0].source)}`;
  }

  /**
   * Handle when a player clicks on a card
   * 
   * This is the main game interaction method that:
   * 1. Checks if the click is valid
   * 2. Flips the card if allowed
   * 3. Checks for matches when 2 cards are flipped
   * 
   * @param card The card object that was clicked
   */
  handleCardClick(card: Card): void {
    console.log('Card Clicked', card);
    
    // === VALIDATION CHECKS ===
    // Don't allow clicking if:
    
    // 1. This card is already flipped
    // 2. Two cards are already flipped and being checked
    // 3. The board is locked during animations
    // 4. The player has no attempts remaining
    if (card.isFlipped || 
        this.flippedCards.length >= 2 || 
        this.lockBoard || 
        this.currentPlayer.attemptsRemaining <= 0) {
      return;
    }
    
    // === FLIP THE CARD ===
    // Mark this card as flipped
    card.isFlipped = true;
    
    // Add this card to our "currently flipped cards" array
    this.flippedCards.push(card);
    console.log(`The number of cards flipped is ` + this.flippedCards.length);
    
    // === CHECK FOR MATCHES ===
    // When we have 2 cards flipped, check if they match
    if (this.flippedCards.length % 2 === 0) {
      // We have two cards flipped, so check if they match
      this.checkForMatch();
    } else {
      console.log(`First card flipped, waiting for second...`);
    }
    
    // Let any listening components know that data has changed
    this.notifyComponents();
  }

  /**
   * Check if the two flipped cards match
   * 
   * This method:
   * 1. Locks the board to prevent further clicks during checking
   * 2. Determines if the cards match based on matchId
   * 3. Either keeps cards face up (match) or flips them back (no match)
   * 4. Updates score and attempts
   */
  private checkForMatch(): void {
    // Lock the board to prevent clicking during processing
    this.lockBoard = true;
    this.notifyComponents();
    
    // Get references to the two flipped cards
    const firstCard = this.flippedCards[0];
    const secondCard = this.flippedCards[1];
    
    // === CHECK IF CARDS MATCH ===
    if (firstCard.matchId === secondCard.matchId) {
      console.log('Cards match! 🎉');
      
      // Update player stats for a successful match
      this.currentPlayer.matchesMade++;
      this.currentPlayer.score += 10;
      
      // Check if player has found all matches
      if (this.currentPlayer.matchesMade === this.cards.length / 2) {
        // Update rank before showing the win message
        this.updatePlayerRank();
        
        // Small delay before showing win message
        setTimeout(() => {
          alert('You win! All matches found! 🏆');
          this.lockBoard = false;
          this.notifyComponents();
        }, 300);
      } else {
        // Not all matches found yet, unlock the board
        this.lockBoard = false;
      }
    } else {
      // === CARDS DON'T MATCH ===
      console.log('Cards do not match 😞');
      
      // Wait a moment so player can see both cards before flipping back
      setTimeout(() => {
        // Flip both cards back
        firstCard.isFlipped = false;
        secondCard.isFlipped = false;
        
        // Decrement attempts remaining
        this.currentPlayer.attemptsRemaining--;
        
        // Check if player is out of attempts
        if (this.currentPlayer.attemptsRemaining === 0) {
          console.log(`Sorry Champ! No more attempts left 😭`);
          this.gameOver();
        }
        
        // Reset game state for next turn
        this.flippedCards = [];
        this.lockBoard = false;
        
        // Let components know that data has changed
        this.notifyComponents();
      }, 1000); // Wait 1 second before flipping cards back
    }
    
    // Clear flipped cards array for next turns
    this.flippedCards = [];
    
    // Let components know that data has changed
    this.notifyComponents();
  }

  /**
   * Update the player's rank based on their score
   * 
   * Higher scores earn better ranks:
   * - 50+ points = "Master"
   * - 30+ points = "Advanced"
   * - 20+ points = "Intermediate"
   * - Below 20 = "Beginner" (default)
   */
  private updatePlayerRank(): void {
    const score = this.currentPlayer.score;
    
    if (score >= 50) {
      this.currentPlayer.rank = "Master";
    } else if (score >= 30) {
      this.currentPlayer.rank = "Advanced";
    } else if (score >= 20) {
      this.currentPlayer.rank = "Intermediate";
    }
    // If below 20, keep as "Beginner"
    
    // Let components know that data has changed
    this.notifyComponents();
  }

  /**
   * Shuffle the cards to randomize their positions
   * 
   * This uses the Fisher-Yates shuffle algorithm:
   * 1. Start from the last card
   * 2. Swap it with a random card from the deck
   * 3. Move to the previous card
   * 4. Repeat until the entire deck is shuffled
   */
  private shuffleCards(): void {
    // Loop through the array backwards
    for (let i = this.cards.length - 1; i > 0; i--) {
      // Pick a random position from 0 to i
      const j = Math.floor(Math.random() * (i + 1));
      
      // Swap cards at positions i and j
      // This cool syntax [a, b] = [b, a] swaps two variables without a temp variable
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    // Let components know that data has changed
    this.notifyComponents();
  }

  /**
   * Handle game over when player is out of attempts
   * 
   * Shows an alert and resets the game
   */
  private gameOver(): void {
    alert("Game Over! You've used all your attempts.");
    this.resetGame();
  }

  /**
   * Reset the game to its initial state
   * 
   * This:
   * 1. Resets player stats (attempts, score, matches)
   * 2. Resets all cards to face-down
   * 3. Shuffles cards into new positions
   * 4. Resets game state variables
   */
  resetGame(): void {
    // Reset player stats
    this.currentPlayer.attemptsRemaining = 3;
    this.currentPlayer.score = 0;
    this.currentPlayer.matchesMade = 0;
    
    // Reset all cards to face-down
    this.cards.forEach(card => card.isFlipped = false);
    
    // Shuffle cards into new positions
    this.shuffleCards();
    
    // Reset game state
    this.lockBoard = false;
    this.flippedCards = [];
    
    // Let components know that data has changed
    this.notifyComponents();
  }

  /**
   * Log card information for debugging purposes
   * 
   * Prints the backside URL of each card to the console
   */
  logCardInfo(): void {
    this.cards.forEach(card => {
      console.log(`Backside URL ` + card.backside);
    });
  }

  /**
   * Notify all listening components that data has changed
   * 
   * This method updates all our BehaviorSubjects to emit the latest values
   * Components that are subscribed will receive these updates automatically
  **/
  private notifyComponents(): void {
    // Create new arrays with the current data
    // The [...array] syntax creates a fresh copy of the array
    this.cardsSubject.next([...this.cards]);
    this.statsSubject.next([...this.stats]);
    
    // For objects, we create a new copy using the spread operator {...obj}
    this.currentPlayerSubject.next({...this.currentPlayer});
    
    // For simple values like booleans, we just send the value
    this.lockBoardSubject.next(this.lockBoard);
  }

  /**
   * Get the current cards array
   * 
   * @returns A copy of the current cards array
   */
  getCards(): Card[] {
    // Return a copy of the array, not the original reference
    return [...this.cards];
  }

  /**
   * Get the current player stats
   * 
   * @returns A copy of the current player's stats
   */
  getCurrentPlayer(): Stats {
    // Return a copy of the object, not the original reference
    return {...this.currentPlayer};
  }
}