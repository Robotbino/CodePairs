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


export interface Stats {
  score: number;             
  rank: string;               
  attemptsRemaining: number;  
  matchesMade: number;       
}

@Injectable({
  providedIn: 'root'
})
export class GamelogicService {
 
  private selectedDifficulty: string = 'easy';

  private cards: Card[] = [];
  

  private stats: Stats[] = [];
  private currentPlayer!: Stats;
  private unknownPlayer!: Stats;
 
  private lockBoard = false;
 
  private flippedCards: Card[] = [];
  private cardsSubject = new BehaviorSubject<Card[]>([]);
  
  private statsSubject = new BehaviorSubject<Stats[]>([]);
  
  private currentPlayerSubject = new BehaviorSubject<Stats | null>(null);
  
  private lockBoardSubject = new BehaviorSubject<boolean>(false);
  
  
  public cards$ = this.cardsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();
  public currentPlayer$ = this.currentPlayerSubject.asObservable();
  public lockBoard$ = this.lockBoardSubject.asObservable();


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
 

  constructor(private sanitizer: DomSanitizer) {}

 
  setDifficulty(level: string): void {
    this.selectedDifficulty = level;
    console.log('Difficulty set to:', this.selectedDifficulty);

  }

  initializeGame(): void {
  
    this.initializeCards();

   
    this.loadPlayerStats();
    
   
    this.currentPlayer = this.stats[0];
    
    this.notifyComponents();
  }

  
  private initializeCards(): void {
    
    this.cards = [
      { 
        //Chip
        id: 1, 
        isFlipped: false, 
        backside: this.initialImages[0].backside, 
        matchId: 'A', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[0].source) 
      },
      { 
        //Memory 
        id: 2, 
        isFlipped: false, 
        backside: this.initialImages[1].backside, 
        matchId: 'B', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[1].source) 
      },
      { 
        //Heart 
        id: 3, 
        isFlipped: false, 
        backside: this.initialImages[2].backside, 
        matchId: 'C', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[2].source) 
      },
      { 
        //Controller 
        id: 4, 
        isFlipped: false, 
        backside: this.initialImages[3].backside, 
        matchId: 'D', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[3].source) 
      },
      { 
        //Wand 
        id: 5, 
        isFlipped: false, 
        backside: this.initialImages[4].backside, 
        matchId: 'E', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[4].source) 
      },
      { 
        //Ghoul
        id: 6, 
        isFlipped: false, 
        backside: this.initialImages[5].backside, 
        matchId: 'F', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[5].source) 
      },{ 
        //Chip
        id: 7, 
        isFlipped: false, 
        backside: this.initialImages[0].backside, 
        matchId: 'A', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[0].source) 
      },
      { 
        //Memory 
        id: 8, 
        isFlipped: false, 
        backside: this.initialImages[1].backside, 
        matchId: 'B', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[1].source) 
      },
      { 
        //Heart 
        id: 9, 
        isFlipped: false, 
        backside: this.initialImages[2].backside, 
        matchId: 'C', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[2].source) 
      },
      { 
        //Controller 
        id: 10, 
        isFlipped: false, 
        backside: this.initialImages[3].backside, 
        matchId: 'D', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[3].source) 
      },
      { 
        //Wand 
        id: 11, 
        isFlipped: false, 
        backside: this.initialImages[4].backside, 
        matchId: 'E', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[4].source) 
      },
      { 
        //Ghoul
        id: 12, 
        isFlipped: false, 
        backside: this.initialImages[5].backside, 
        matchId: 'F', 
        source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[5].source) 
      }
    ];
    
    this.shuffleCards();
  }


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

 
  getInitialIcon(index: number): string {
    
    if (index < this.initialImages.length) {
      return `data:image/svg+xml,${encodeURIComponent(this.initialImages[index].source)}`;
    }
    
  
    console.log("Invalid icon index, using default");
    return `data:image/svg+xml,${encodeURIComponent(this.initialImages[0].source)}`;
  }


  handleCardClick(card: Card): void {
    console.log('Card Clicked', card);
  
    if (card.isFlipped || 
        this.flippedCards.length >= 2 || 
        this.lockBoard || 
        this.currentPlayer.attemptsRemaining <= 0) {
      return;
    }
 
    card.isFlipped = true;
    

    this.flippedCards.push(card);
    console.log(`The number of cards flipped is ` + this.flippedCards.length);
    

    if (this.flippedCards.length % 2 === 0) {
      this.checkForMatch();
    } else {
      console.log(`First card flipped, waiting for second...`);
    }
    
    this.notifyComponents();
  }

  private checkForMatch(): void {

    this.lockBoard = true;
    this.notifyComponents();
    
    const firstCard = this.flippedCards[0];
    const secondCard = this.flippedCards[1];
    

    if (firstCard.matchId === secondCard.matchId) {
      console.log('Cards match! 🎉');
      
 
      this.currentPlayer.matchesMade++;
      this.currentPlayer.score += 10;
      
 
      if (this.currentPlayer.matchesMade === this.cards.length / 2) {

        this.updatePlayerRank();

        setTimeout(() => {
          alert('You win! All matches found! 🏆');
          this.lockBoard = false;
          this.notifyComponents();
        }, 300);
      } else {

        this.lockBoard = false;
      }
    } else {

      console.log('Cards do not match 😞');
      
      
      setTimeout(() => {
   
        firstCard.isFlipped = false;
        secondCard.isFlipped = false;
   
        this.currentPlayer.attemptsRemaining--;
        
  
        if (this.currentPlayer.attemptsRemaining === 0) {
          console.log(`Sorry Champ! No more attempts left 😭`);
          this.gameOver();
        }
        
  
        this.flippedCards = [];
        this.lockBoard = false;
        
        
        this.notifyComponents();
      }, 1000); 
    }
    

    this.flippedCards = [];
    

    this.notifyComponents();
  }

 
  private updatePlayerRank(): void {
    const score = this.currentPlayer.score;
    
    if (score >= 50) {
      this.currentPlayer.rank = "Master";
    } else if (score >= 30) {
      this.currentPlayer.rank = "Advanced";
    } else if (score >= 20) {
      this.currentPlayer.rank = "Intermediate";
    }

    this.notifyComponents();
  }

  private shuffleCards(): void {
    
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
   
    this.notifyComponents();
  }

  
  private gameOver(): void {
    alert("Game Over! You've used all your attempts.");
    this.resetGame();
  }

  
  resetGame(): void {
   
    this.currentPlayer.attemptsRemaining = 3;
    this.currentPlayer.score = 0;
    this.currentPlayer.matchesMade = 0;
    
   
    this.cards.forEach(card => card.isFlipped = false);
    
   
    this.shuffleCards();
    
    
    this.lockBoard = false;
    this.flippedCards = [];
    
    
    this.notifyComponents();
  }


  logCardInfo(): void {
    this.cards.forEach(card => {
      console.log(`Backside URL ` + card.backside);
    });
  }

  
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

  
  getCards(): Card[] {
    // Return a copy of the array, not the original reference
    return [...this.cards];
  }

  getCurrentPlayer(): Stats {
    // Return a copy of the object, not the original reference
    return {...this.currentPlayer};
  }
}