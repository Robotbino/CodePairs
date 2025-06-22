import { Component } from '@angular/core';
import { GamelogicService } from '../../app/gamelogic.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-difficulty-selector',
  standalone: false,
  templateUrl: './difficulty-selector.component.html',
  styleUrl: './difficulty-selector.component.css'
})
export class DifficultySelectorComponent {

   constructor(private router: Router, private gameService: GamelogicService) {}
   
   selectDifficulty(level: string): void {
    this.gameService.setDifficulty(level);

    this.router.navigate(['/sandBox']);
  }
}
