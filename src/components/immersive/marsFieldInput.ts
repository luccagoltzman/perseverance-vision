export interface FieldInputSnapshot {
  forward: number;
  turn: number;
  sprint: boolean;
  jump: boolean;
  wave: boolean;
  photo: boolean;
}

const EMPTY_SNAPSHOT: FieldInputSnapshot = {
  forward: 0,
  turn: 0,
  sprint: false,
  jump: false,
  wave: false,
  photo: false,
};

export class FieldInputController {
  private keys = new Set<string>();
  private paused = false;
  touch: FieldInputSnapshot = { ...EMPTY_SNAPSHOT };
  private jumpQueued = false;
  private waveQueued = false;
  private photoQueued = false;

  private static readonly MOVE_KEYS = new Set([
    'w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
  ]);

  attach(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  detach(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.keys.clear();
    this.touch = { ...EMPTY_SNAPSHOT };
    this.jumpQueued = false;
    this.waveQueued = false;
    this.photoQueued = false;
    this.paused = false;
  }

  setPaused(value: boolean): void {
    this.paused = value;
    if (value) {
      this.keys.clear();
      this.touch = { ...EMPTY_SNAPSHOT };
    }
  }

  queueJump(): void {
    if (!this.paused) this.jumpQueued = true;
  }

  queueWave(): void {
    if (!this.paused) this.waveQueued = true;
  }

  queuePhoto(): void {
    if (!this.paused) this.photoQueued = true;
  }

  snapshot(): FieldInputSnapshot {
    if (this.paused) return { ...EMPTY_SNAPSHOT };

    let forward = this.touch.forward;
    let turn = this.touch.turn;
    let sprint = this.touch.sprint;

    if (this.keys.has('w') || this.keys.has('arrowup')) forward += 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) forward -= 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) turn += 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) turn -= 1;
    if (this.keys.has('shift')) sprint = true;

    const jump = this.jumpQueued;
    this.jumpQueued = false;
    const wave = this.waveQueued;
    this.waveQueued = false;
    const photo = this.photoQueued;
    this.photoQueued = false;

    return {
      forward: Math.max(-1, Math.min(1, forward)),
      turn: Math.max(-1, Math.min(1, turn)),
      sprint,
      jump: jump || this.touch.jump,
      wave: wave || this.keys.has('e') || this.touch.wave,
      photo: photo || this.keys.has('p') || this.touch.photo,
    };
  }

  private isTypingTarget(): boolean {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.paused || this.isTypingTarget()) return;

    const key = e.key.toLowerCase();
    if (key === 'e') {
      this.waveQueued = true;
      e.preventDefault();
      return;
    }
    if (key === 'p') {
      this.photoQueued = true;
      e.preventDefault();
      return;
    }
    if (!FieldInputController.MOVE_KEYS.has(key) && key !== 'shift') return;
    this.keys.add(key);
    e.preventDefault();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (this.paused || this.isTypingTarget()) return;
    this.keys.delete(e.key.toLowerCase());
  };

  private onBlur = () => {
    this.keys.clear();
  };
}
