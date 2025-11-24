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
}
@Component({
  selector: 'app-sand-box',
  standalone: false,
  templateUrl: './sand-box.component.html',
  styleUrl: './sand-box.component.css'
})
export class SandBoxComponent implements OnInit {
  
  cards: Card[] = [];
  currentPlayer!: Stats;
  lockBoard = false;

  
  constructor(private gameService: GamelogicService) {}

  
  ngOnInit() {
    //Start the game
    this.gameService.initializeGame();
    
    //Subscriber to the cards Observable
    this.gameService.cards$.subscribe(updatedCards => {
      this.cards = updatedCards;
    });
    
    //Subscriber to the playe Observable
    this.gameService.currentPlayer$.subscribe(updatedPlayer => {
      if (updatedPlayer) {
        this.currentPlayer = updatedPlayer;
      }
    });
    //Subsriber to the lockBoard Observable
    this.gameService.lockBoard$.subscribe(isLocked => {
      this.lockBoard = isLocked;
    });
    
    //Some other service stuff
    this.showFunctions();
  }

  
  handleCardClick(card: Card) {
    this.gameService.handleCardClick(card);
  }

 
  showFunctions() {
    this.gameService.logCardInfo();
  }

  
  resetGame() {
    this.gameService.resetGame();
  }
}
