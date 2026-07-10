import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { Card } from '../../../../core/models/game.models';

/**
 * A single memory card. Pure and OnPush: it renders whatever `card` it's given
 * and emits `flip` on click — all game rules live in the service.
 */
@Component({
  selector: 'cp-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  host: {
    '[class.is-flipped]': 'isRevealed()',
    '[class.is-matched]': 'isMatched()',
    '[class.is-wrong]': 'wrong()',
    '[attr.aria-pressed]': 'isRevealed()',
    '[attr.aria-label]': 'ariaLabel()',
    role: 'button',
    tabindex: '0',
    '(click)': 'onActivate()',
    '(keydown.enter)': 'onActivate()',
    '(keydown.space)': 'onActivate($event)',
  },
})
export class CardComponent {
  readonly card = input.required<Card>();
  readonly wrong = input(false);
  readonly flip = output<Card>();

  readonly isRevealed = computed(() => this.card().status !== 'hidden');
  readonly isMatched = computed(() => this.card().status === 'matched');
  readonly ariaLabel = computed(() =>
    this.card().status === 'hidden'
      ? 'Hidden card'
      : `${this.card().label} card`,
  );

  onActivate(event?: Event): void {
    event?.preventDefault();
    if (this.card().status === 'hidden') {
      this.flip.emit(this.card());
    }
  }
}
