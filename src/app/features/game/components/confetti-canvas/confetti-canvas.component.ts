import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { ConfettiSystem } from '../../../../core/services/confetti';

/**
 * Full-bleed canvas that fires celebratory confetti bursts. Drop it into a
 * container and it self-starts on view init and cleans up on destroy.
 */
@Component({
  selector: 'cp-confetti-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<canvas #canvas class="confetti"></canvas>',
  styles: [
    `
      :host {
        position: absolute;
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
  private readonly canvasRef =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private system: ConfettiSystem | null = null;
  private readonly onResize = () => this.system?.resize();

  ngAfterViewInit(): void {
    this.system = new ConfettiSystem(this.canvasRef().nativeElement);
    window.addEventListener('resize', this.onResize);
    // Initial celebration, then two follow-up bursts for a sustained shower.
    this.system.burst({ count: 140 });
    setTimeout(() => this.system?.burst({ count: 90 }), 350);
    setTimeout(() => this.system?.burst({ count: 70 }), 800);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    this.system?.destroy();
  }
}
