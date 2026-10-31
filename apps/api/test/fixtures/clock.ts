import type { Clock } from "../../src/application/ports/Clock.js";

// A clock the tests can move forward, for example past a reset link's 30 minutes
export class FakeClock implements Clock {
  private current: Date;

  constructor(start = new Date("2026-10-21T10:00:00Z")) {
    this.current = start;
  }

  now() {
    return new Date(this.current);
  }

  advanceMinutes(minutes: number) {
    this.current = new Date(this.current.getTime() + minutes * 60 * 1000);
  }

  reset(to = new Date("2026-10-21T10:00:00Z")) {
    this.current = to;
  }
}
