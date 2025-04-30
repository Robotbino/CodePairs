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
//Initializing the array for cards that will be holding our data:)
cards: Card[]= [];
stats: Stats[]=[];
currentPlayer!: Stats;
lockBoard = false;
// Track flipped cards for matching logic
flippedCards: Card[] = [];

//Initialing the array of the image sources I will be using from font-awesome
initialImages: {name: string,backside:string; source:string}[]=[{
  name:`chip`,
  backside:`/assets/CodePairs.png`,
  source:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M176 24c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c-35.3 0-64 28.7-64 64l-40 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l40 0 0 56-40 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l40 0 0 56-40 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l40 0c0 35.3 28.7 64 64 64l0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40 56 0 0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40 56 0 0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40c35.3 0 64-28.7 64-64l40 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-40 0 0-56 40 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-40 0 0-56 40 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-40 0c0-35.3-28.7-64-64-64l0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40-56 0 0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40-56 0 0-40zM160 128l192 0c17.7 0 32 14.3 32 32l0 192c0 17.7-14.3 32-32 32l-192 0c-17.7 0-32-14.3-32-32l0-192c0-17.7 14.3-32 32-32zm192 32l-192 0 0 192 192 0 0-192z"/></svg>`
},
{
  name: `Memory`,
  backside:`/assets/CodePairs.png`,
  source:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M64 64C28.7 64 0 92.7 0 128l0 7.4c0 6.8 4.4 12.6 10.1 16.3C23.3 160.3 32 175.1 32 192s-8.7 31.7-21.9 40.3C4.4 236 0 241.8 0 248.6L0 320l576 0 0-71.4c0-6.8-4.4-12.6-10.1-16.3C552.7 223.7 544 208.9 544 192s8.7-31.7 21.9-40.3c5.7-3.7 10.1-9.5 10.1-16.3l0-7.4c0-35.3-28.7-64-64-64L64 64zM576 352L0 352l0 64c0 17.7 14.3 32 32 32l48 0 0-32c0-8.8 7.2-16 16-16s16 7.2 16 16l0 32 96 0 0-32c0-8.8 7.2-16 16-16s16 7.2 16 16l0 32 96 0 0-32c0-8.8 7.2-16 16-16s16 7.2 16 16l0 32 96 0 0-32c0-8.8 7.2-16 16-16s16 7.2 16 16l0 32 48 0c17.7 0 32-14.3 32-32l0-64zM192 160l0 64c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32s32 14.3 32 32zm128 0l0 64c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32s32 14.3 32 32zm128 0l0 64c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32s32 14.3 32 32z"/></svg>`
},
{
  name: `Heart`,
  backside:`/assets/CodePairs.png`,
  source:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></svg>`
},
{
  name: `Controller`,
  backside:`/assets/CodePairs.png`,
  source:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M192 64C86 64 0 150 0 256S86 448 192 448l256 0c106 0 192-86 192-192s-86-192-192-192L192 64zM496 168a40 40 0 1 1 0 80 40 40 0 1 1 0-80zM392 304a40 40 0 1 1 80 0 40 40 0 1 1 -80 0zM168 200c0-13.3 10.7-24 24-24s24 10.7 24 24l0 32 32 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-32 0 0 32c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-32-32 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l32 0 0-32z"/></svg>`
}]

constructor(private sanitizer: DomSanitizer){

}

  ngOnInit() {
    this.initializeCards();
    this.showfunctions();
    this.loadplayerStats();
    this.currentPlayer=this.stats[0];
  }
//Cotains card details
initializeCards(){
  this.cards=[
    {id:1,isFlipped:false,backside: this.initialImages[0].backside,matchId:'A',source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[0].source)},
    {id:2,isFlipped:false,backside: this.initialImages[0].backside,matchId:'B',source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[1].source)},
    {id:3,isFlipped:false,backside: this.initialImages[0].backside,matchId:'A',source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[0].source)},
    {id:4,isFlipped:false,backside: this.initialImages[0].backside,matchId:'B',source: this.sanitizer.bypassSecurityTrustHtml(this.initialImages[1].source)}

  ]
  this.shuffleCards();
}

loadplayerStats(){
  this.stats=[
    {
      score:0,rank:"Beginner",attemptsRemaining:3,matchesMade:0
    }
  
  ]
}
 getInitialIcons(index:number){
  if(index<this.initialImages.length){
    return `data:image/svg+xml,${encodeURIComponent(this.initialImages[index].source)}`
  }
  //Default Icon
  console.log(encodeURIComponent(this.initialImages[0].name))
  return `data:image/svg+xml,${encodeURIComponent(this.initialImages[0].source)}`;
 }

 handleCardClick(card:any){
  console.log('Card Clicked',card);
  /* Don't do anything if:
  This card is already flipped
  We already have two cards flipped
  The board is locked during animation/checking
  OR WHEN THE PLAYER IS OUT OF ATTEMPTS */
  if (card.isFlipped || this.flippedCards.length >= 2 || this.lockBoard || this.currentPlayer.attemptsRemaining <= 0) {
    return;
  }
   // Flip the card
   card.isFlipped = true;
   /*  
    Add the cards to 
      a new Object */ 
   this.flippedCards.push(card);

   console.log(` The number of cards flipped is `+ this.flippedCards.length);

   
   // Check for matches when we have 2 cards flipped and locks our grid
  if (this.flippedCards.length === 2) {
    this.lockBoard = true;
    setTimeout(() => this.checkForMatch(), 1000);
  }
}

  checkForMatch() {
    //Setting the cards flipped(with their data into variables called firstcard and secondCard)
    const [firstCard, secondCard] = this.flippedCards;
    if (firstCard.matchId === secondCard.matchId) {
      console.log('Cards match!');
      this.currentPlayer.matchesMade++;
      this.currentPlayer.score += 10;
      if (this.currentPlayer.matchesMade === this.cards.length / 2) {
        console.log('You win! All matches found!');
        // Update rank based on performance
        this.updatePlayerRank();
      }
  } 
  else {
    console.log('Cards do not match');
    // No match then the flip cards back
    firstCard.isFlipped = false;
    secondCard.isFlipped = false;
    // Now we decrement attempts when they get it wrong
    this.currentPlayer.attemptsRemaining--;
   }

   if (this.currentPlayer.attemptsRemaining <= 0) {
    console.log(`Sorry Champ! No more attempts left :'( `);
    // Handle game over logic
    this.gameOver();
  }
  //if
    // Clear flipped cards array
    this.flippedCards = [];
  }
  updatePlayerRank() {
    const score = this.currentPlayer.score;
    
    if (score >= 50) {
      this.currentPlayer.rank = "Master";
    } else if (score >= 30) {
      this.currentPlayer.rank = "Advanced";
    } else if (score >= 20) {
      this.currentPlayer.rank = "Intermediate";
    }
  }


  // Fisher-Yates shuffle algorithm
  shuffleCards() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  gameOver() {
    // You can add game over logic here
    // For example, display a message or restart the game
    alert("Game Over! You've used all your attempts.");
    
    // Optional: Reset the game
    // this.resetGame();
  }

 showfunctions(){
  this.cards.forEach(card=>{
    console.log(`Backside URL `+ card.backside);
  })
 }
}
