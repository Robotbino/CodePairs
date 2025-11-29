import { Injectable } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { CARD_IMAGES, CardImageData } from "./data/card-images";


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
interface cardDimentions{
  height: number;
  width: number;
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
  private gridEl = document.getElementById('uiGrid'); 
  private lockBoard = false;
 
  private flippedCards: Card[] = [];
  private cardsSubject = new BehaviorSubject<Card[]>([]);
  
  private statsSubject = new BehaviorSubject<Stats[]>([]);
 
  private currentPlayerSubject = new BehaviorSubject<Stats | null>(null);
  
  private lockBoardSubject = new BehaviorSubject<boolean>(false);
  //Broadcaster
  
  private gridWidthSubject = new BehaviorSubject<number>(600);
  private gridheightSubject = new BehaviorSubject<number>(700);
  private cardSizeSubject = new BehaviorSubject<number>(120);
  private cardDimensionSubject= new BehaviorSubject<cardDimentions>({height:250,width:180})
  public cardDimension$ = this.cardDimensionSubject.asObservable();
  public cardSize$ = this.cardSizeSubject.asObservable();
  public gridWidth$ = this.gridWidthSubject.asObservable();
  public gridHeight$ = this.gridheightSubject.asObservable();
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
    },
    {
      name: `Discord`,
      backside: `/assets/CodePairs.png`,
      source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M524.5 133.8C524.3 133.5 524.1 133.2 523.7 133.1C485.6 115.6 445.3 103.1 404 96C403.6 95.9 403.2 96 402.9 96.1C402.6 96.2 402.3 96.5 402.1 96.9C396.6 106.8 391.6 117.1 387.2 127.5C342.6 120.7 297.3 120.7 252.8 127.5C248.3 117 243.3 106.8 237.7 96.9C237.5 96.6 237.2 96.3 236.9 96.1C236.6 95.9 236.2 95.9 235.8 95.9C194.5 103 154.2 115.5 116.1 133C115.8 133.1 115.5 133.4 115.3 133.7C39.1 247.5 18.2 358.6 28.4 468.2C28.4 468.5 28.5 468.7 28.6 469C28.7 469.3 28.9 469.4 29.1 469.6C73.5 502.5 123.1 527.6 175.9 543.8C176.3 543.9 176.7 543.9 177 543.8C177.3 543.7 177.7 543.4 177.9 543.1C189.2 527.7 199.3 511.3 207.9 494.3C208 494.1 208.1 493.8 208.1 493.5C208.1 493.2 208.1 493 208 492.7C207.9 492.4 207.8 492.2 207.6 492.1C207.4 492 207.2 491.8 206.9 491.7C191.1 485.6 175.7 478.3 161 469.8C160.7 469.6 160.5 469.4 160.3 469.2C160.1 469 160 468.6 160 468.3C160 468 160 467.7 160.2 467.4C160.4 467.1 160.5 466.9 160.8 466.7C163.9 464.4 167 462 169.9 459.6C170.2 459.4 170.5 459.2 170.8 459.2C171.1 459.2 171.5 459.2 171.8 459.3C268 503.2 372.2 503.2 467.3 459.3C467.6 459.2 468 459.1 468.3 459.1C468.6 459.1 469 459.3 469.2 459.5C472.1 461.9 475.2 464.4 478.3 466.7C478.5 466.9 478.7 467.1 478.9 467.4C479.1 467.7 479.1 468 479.1 468.3C479.1 468.6 479 468.9 478.8 469.2C478.6 469.5 478.4 469.7 478.2 469.8C463.5 478.4 448.2 485.7 432.3 491.6C432.1 491.7 431.8 491.8 431.6 492C431.4 492.2 431.3 492.4 431.2 492.7C431.1 493 431.1 493.2 431.1 493.5C431.1 493.8 431.2 494 431.3 494.3C440.1 511.3 450.1 527.6 461.3 543.1C461.5 543.4 461.9 543.7 462.2 543.8C462.5 543.9 463 543.9 463.3 543.8C516.2 527.6 565.9 502.5 610.4 469.6C610.6 469.4 610.8 469.2 610.9 469C611 468.8 611.1 468.5 611.1 468.2C623.4 341.4 590.6 231.3 524.2 133.7zM222.5 401.5C193.5 401.5 169.7 374.9 169.7 342.3C169.7 309.7 193.1 283.1 222.5 283.1C252.2 283.1 275.8 309.9 275.3 342.3C275.3 375 251.9 401.5 222.5 401.5zM417.9 401.5C388.9 401.5 365.1 374.9 365.1 342.3C365.1 309.7 388.5 283.1 417.9 283.1C447.6 283.1 471.2 309.9 470.7 342.3C470.7 375 447.5 401.5 417.9 401.5z"/></svg>`
    },
    {
      name: `Discord`,
      backside: `/assets/CodePairs.png`,
      source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M524.5 133.8C524.3 133.5 524.1 133.2 523.7 133.1C485.6 115.6 445.3 103.1 404 96C403.6 95.9 403.2 96 402.9 96.1C402.6 96.2 402.3 96.5 402.1 96.9C396.6 106.8 391.6 117.1 387.2 127.5C342.6 120.7 297.3 120.7 252.8 127.5C248.3 117 243.3 106.8 237.7 96.9C237.5 96.6 237.2 96.3 236.9 96.1C236.6 95.9 236.2 95.9 235.8 95.9C194.5 103 154.2 115.5 116.1 133C115.8 133.1 115.5 133.4 115.3 133.7C39.1 247.5 18.2 358.6 28.4 468.2C28.4 468.5 28.5 468.7 28.6 469C28.7 469.3 28.9 469.4 29.1 469.6C73.5 502.5 123.1 527.6 175.9 543.8C176.3 543.9 176.7 543.9 177 543.8C177.3 543.7 177.7 543.4 177.9 543.1C189.2 527.7 199.3 511.3 207.9 494.3C208 494.1 208.1 493.8 208.1 493.5C208.1 493.2 208.1 493 208 492.7C207.9 492.4 207.8 492.2 207.6 492.1C207.4 492 207.2 491.8 206.9 491.7C191.1 485.6 175.7 478.3 161 469.8C160.7 469.6 160.5 469.4 160.3 469.2C160.1 469 160 468.6 160 468.3C160 468 160 467.7 160.2 467.4C160.4 467.1 160.5 466.9 160.8 466.7C163.9 464.4 167 462 169.9 459.6C170.2 459.4 170.5 459.2 170.8 459.2C171.1 459.2 171.5 459.2 171.8 459.3C268 503.2 372.2 503.2 467.3 459.3C467.6 459.2 468 459.1 468.3 459.1C468.6 459.1 469 459.3 469.2 459.5C472.1 461.9 475.2 464.4 478.3 466.7C478.5 466.9 478.7 467.1 478.9 467.4C479.1 467.7 479.1 468 479.1 468.3C479.1 468.6 479 468.9 478.8 469.2C478.6 469.5 478.4 469.7 478.2 469.8C463.5 478.4 448.2 485.7 432.3 491.6C432.1 491.7 431.8 491.8 431.6 492C431.4 492.2 431.3 492.4 431.2 492.7C431.1 493 431.1 493.2 431.1 493.5C431.1 493.8 431.2 494 431.3 494.3C440.1 511.3 450.1 527.6 461.3 543.1C461.5 543.4 461.9 543.7 462.2 543.8C462.5 543.9 463 543.9 463.3 543.8C516.2 527.6 565.9 502.5 610.4 469.6C610.6 469.4 610.8 469.2 610.9 469C611 468.8 611.1 468.5 611.1 468.2C623.4 341.4 590.6 231.3 524.2 133.7zM222.5 401.5C193.5 401.5 169.7 374.9 169.7 342.3C169.7 309.7 193.1 283.1 222.5 283.1C252.2 283.1 275.8 309.9 275.3 342.3C275.3 375 251.9 401.5 222.5 401.5zM417.9 401.5C388.9 401.5 365.1 374.9 365.1 342.3C365.1 309.7 388.5 283.1 417.9 283.1C447.6 283.1 471.2 309.9 470.7 342.3C470.7 375 447.5 401.5 417.9 401.5z"/></svg>`
    }

    
  ];
 

  constructor(private sanitizer: DomSanitizer) {}

 
  setGridWidth(difficulty: string) {
  switch(difficulty) {
    case 'easy':
      // 2x2 grid (4 cards)
      this.gridWidthSubject.next(550);
      this.gridheightSubject.next(490);
      this.cardDimensionSubject.next({height: 210, width: 190});
      break;
    case 'medium':
      // 4x2 grid (8 cards)
      this.gridWidthSubject.next(650);
      this.gridheightSubject.next(510);
      this.cardDimensionSubject.next({height: 220, width: 130});
      break;
    case 'hard':
      // 4x3 grid (12 cards)
      this.gridWidthSubject.next(580);
      this.gridheightSubject.next(550);
      this.cardDimensionSubject.next({height: 150, width: 120});
      break;
    default:
      this.gridWidthSubject.next(580);
      this.gridheightSubject.next(500);
  }
}

  setDifficulty(level: string): void {
    this.selectedDifficulty = level;
    this.setGridWidth(this.selectedDifficulty);
    console.log('Difficulty set to:', this.selectedDifficulty);
  }

  //setGrid(){
    // if(this.selectedDifficulty === 'easy')
    //   {
    //     //We want the grid here to render 2 by 2 so 4  cards
    //     this.gridEl!.style.width = '500px';
        
    //   }else if(this.selectedDifficulty === 'medium'
    //   ){
    //      //We want the grid here to render 3 by 3 so 9 cards
    //      this.gridEl!.style.width = '600px';
    //   }else{
    //      //We want the grid here to render 4 by 4 so 12 cards
    //      this.gridEl!.style.width = '700px';
    //   };
 // }

 private generateCards(pairCount: number): Card[] {
  const selectedImages = CARD_IMAGES.slice(0, pairCount);
  
  const cards: Card[] = [];
  
  // Create both cards in each pair
  selectedImages.forEach((img, index) => {
    const matchId = String.fromCharCode(65 + index); // 'A', 'B', 'C'...
    
    // First card of the pair
    cards.push({
      //0,3,5
      id: index * 2 + 1,
      isFlipped: false,
      backside: img.backside,
      matchId: matchId,
      source: this.sanitizer.bypassSecurityTrustHtml(img.source)
    });
    
    // Second card of the pair
    cards.push({
      id: index * 2 + 2,
      isFlipped: false,
      backside: img.backside,
      matchId: matchId,
      source: this.sanitizer.bypassSecurityTrustHtml(img.source)
    });
  });
  
  return cards;
}
  initializeGame(): void {
    this.setGridWidth(this.selectedDifficulty)
    
    this.initializeCards(this.selectedDifficulty);

   
    this.loadPlayerStats();
    
   
    this.currentPlayer = this.stats[0];
    
    this.notifyComponents();
  }

  
  private initializeCards(difficulty: string): void {
    if(difficulty==='easy'){
       this.cards = this.generateCards(2);
    }else if(difficulty==='medium'){
      this.cards = this.generateCards(4);
    }else{
      this.cards = this.generateCards(6);
    }
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