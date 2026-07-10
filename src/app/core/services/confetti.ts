/**
 * A tiny, dependency-free canvas confetti system. Brutalist square/rect
 * particles fall with gravity, drift and rotation. Frameworks own the <canvas>;
 * this just drives the animation loop and cleans itself up.
 */
export interface ConfettiOptions {
  colors?: string[];
  /** Particles per burst. */
  count?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
  life: number;
}

const DEFAULT_COLORS = ['#8fc93a', '#ffffff', '#ffd23f', '#4cc9f0', '#ff4d9d'];
const GRAVITY = 0.16;
const DRAG = 0.992;

export class ConfettiSystem {
  private ctx: CanvasRenderingContext2D | null;
  private particles: Particle[] = [];
  private rafId = 0;
  private running = false;
  private dpr = Math.min(globalThis.devicePixelRatio || 1, 2);

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
    this.resize();
  }

  resize(): void {
    const { canvas } = this;
    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    canvas.width = w * this.dpr;
    canvas.height = h * this.dpr;
    this.ctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /** Emit a burst from the top spread across the width. */
  burst(options: ConfettiOptions = {}): void {
    const colors = options.colors ?? DEFAULT_COLORS;
    const count = options.count ?? 120;
    const w = this.canvas.clientWidth || this.canvas.width;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: -20 - Math.random() * 60,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 8 + 5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      });
    }
    if (!this.running) this.loop();
  }

  private loop = (): void => {
    const { ctx } = this;
    if (!ctx) return;
    this.running = true;

    const w = this.canvas.clientWidth || this.canvas.width;
    const h = this.canvas.clientHeight || this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    for (const p of this.particles) {
      p.vy += GRAVITY;
      p.vx *= DRAG;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y > h * 0.75) p.life -= 0.02;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    this.particles = this.particles.filter((p) => p.life > 0 && p.y < h + 40);

    if (this.particles.length > 0) {
      this.rafId = requestAnimationFrame(this.loop);
    } else {
      this.running = false;
      ctx.clearRect(0, 0, w, h);
    }
  };

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    this.running = false;
    this.particles = [];
    this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
