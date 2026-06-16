export interface FieldInputSnapshot {
  forward: number;
  turn: number;
  sprint: boolean;
  jump: boolean;
  wave: boolean;
}

export class FieldInputController {
  private keys = new Set<string>();
  touch: FieldInputSnapshot = { forward: 0, turn: 0, sprint: false, jump: false, wave: false };
  private jumpQueued = false;
  private waveQueued = false;

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
    this.touch = { forward: 0, turn: 0, sprint: false, jump: false, wave: false };
    this.jumpQueued = false;
    this.waveQueued = false;
  }

  queueJump(): void {
    this.jumpQueued = true;
  }

  queueWave(): void {
    this.waveQueued = true;
  }

  snapshot(): FieldInputSnapshot {
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

    return {
      forward: Math.max(-1, Math.min(1, forward)),
      turn: Math.max(-1, Math.min(1, turn)),
      sprint,
      jump: jump || this.keys.has(' ') || this.touch.jump,
      wave: wave || this.keys.has('e') || this.touch.wave,
    };
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key === ' ' || key === 'spacebar') {
      this.jumpQueued = true;
      e.preventDefault();
      return;
    }
    if (key === 'e') {
      this.waveQueued = true;
      e.preventDefault();
      return;
    }
    if (!FieldInputController.MOVE_KEYS.has(key) && key !== 'shift') return;
    this.keys.add(key);
    e.preventDefault();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  private onBlur = () => {
    this.keys.clear();
  };
}
