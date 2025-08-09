export class Coalescer {
  private pending = '';
  private timer: any = null;
  constructor(private intervalMs: number, private onFlush: (chunk: string) => void) {}
  add(str: string) {
    this.pending += str;
  }
  start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (this.pending.length > 0) {
        const out = this.pending;
        this.pending = '';
        this.onFlush(out);
      }
    }, this.intervalMs);
  }
  stop(flush = true) {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (flush && this.pending.length > 0) {
      const out = this.pending;
      this.pending = '';
      this.onFlush(out);
    }
  }
}
