import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { ConfettiSystem } from '../../../../core/services/confetti';
import { prefersReducedMotion } from '../../../../core/util/motion';

/** Design tokens the confetti pieces are drawn in. */
const CONFETTI_TOKENS = [
  '--cp-sun',
  '--cp-pink',
  '--cp-sky',
  '--cp-lilac',
  '--cp-mint',
  '--cp-tangerine',
];

/**
 * Full-viewport canvas that fires celebratory confetti bursts. Drop it into a
 * container and it self-starts on view init and cleans up on destroy. The
 * animation runs outside Angular's zone so it never competes with taps.
 */
@Component({
  selector: 'cp-confetti-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<canvas #canvas class="confetti"></canvas>',
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 2;
      }
      .confetti {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ],
})
export class ConfettiCanvasComponent implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly canvasRef =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private system: ConfettiSystem | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private readonly onResize = () => this.system?.resize();

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const canvas = this.canvasRef().nativeElement;
      this.system = new ConfettiSystem(canvas, this.paletteFromTokens(canvas));
      window.addEventListener('resize', this.onResize);

      if (prefersReducedMotion()) {
        this.system.burst({ count: 40 });
        return;
      }
      // Initial celebration, then two follow-up bursts for a sustained shower.
      this.system.burst({ count: 140 });
      this.timers.push(
        setTimeout(() => this.system?.burst({ count: 90 }), 350),
        setTimeout(() => this.system?.burst({ count: 70 }), 800),
      );
    });
  }

  ngOnDestroy(): void {
    this.timers.forEach((t) => clearTimeout(t));
    window.removeEventListener('resize', this.onResize);
    this.system?.destroy();
    this.system = null;
  }

  /** Read the candy colours from CSS so the canvas follows the theme. */
  private paletteFromTokens(el: Element): string[] | undefined {
    const css = getComputedStyle(el);
    const colors = CONFETTI_TOKENS.map((t) =>
      css.getPropertyValue(t).trim(),
    ).filter(Boolean);
    return colors.length ? colors : undefined;
  }
}
