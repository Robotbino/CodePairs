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
 *
 * The host element is the hit box and never moves; all motion happens on
 * inner layers, so a press can't slide out from under the pointer.
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
    '[style.--tone]': 'toneColor()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-disabled]': 'isRevealed() ? "true" : null',
    role: 'button',
    tabindex: '0',
    '(click)': 'onActivate()',
    '(keydown.enter)': 'onActivate($event)',
    '(keydown.space)': 'onActivate($event)',
  },
})
export class CardComponent {
  readonly card = input.required<Card>();
  readonly wrong = input(false);
  /** Slot of the revealed-face colour (`--cp-tone-N`). */
  readonly tone = input(0);
  /** Position on the board, for the accessible name. */
  readonly index = input(0);
  readonly flip = output<Card>();

  readonly isRevealed = computed(() => this.card().status !== 'hidden');
  readonly isMatched = computed(() => this.card().status === 'matched');
  readonly toneColor = computed(() => `var(--cp-tone-${this.tone()})`);
  readonly ariaLabel = computed(() => {
    const { status, label } = this.card();
    const position = `Card ${this.index() + 1}`;
    if (status === 'hidden') return `${position}, face down`;
    return `${position}, ${label}, ${status === 'matched' ? 'matched' : 'face up'}`;
  });

  onActivate(event?: Event): void {
    event?.preventDefault();
    if (this.card().status === 'hidden') {
      this.flip.emit(this.card());
    }
  }
}
