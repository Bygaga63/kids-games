import { say } from './voice';

// Звуковые эффекты: верно/неверно (Web Audio, без файлов)
let AC: AudioContext | null = null;

export function sfx(ok: boolean): void {
  try {
    AC =
      AC || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const t = AC.currentTime;
    const mk = (
      f: number,
      st: number,
      dur: number,
      type: OscillatorType,
      vol: number,
    ) => {
      const o = AC!.createOscillator();
      const g = AC!.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t + st);
      g.gain.setValueAtTime(0.0001, t + st);
      g.gain.exponentialRampToValueAtTime(vol, t + st + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + st + dur);
      o.connect(g);
      g.connect(AC!.destination);
      o.start(t + st);
      o.stop(t + st + dur + 0.05);
    };
    if (ok) {
      mk(659, 0, 0.14, 'sine', 0.22);
      mk(880, 0.11, 0.22, 'sine', 0.22);
    } else {
      mk(233, 0, 0.18, 'square', 0.09);
      mk(175, 0.14, 0.26, 'square', 0.09);
    }
  } catch {}
}

/**
 * Озвучка текста: предзаписанный нейро-клип, при отсутствии — speechSynthesis
 * (см. lib/voice.ts). rate/pitch оставлены для совместимости и влияют только
 * на фолбэк через выбор пресета; новые фразы добавляются в scripts/generate-voice.mjs.
 */
export function speak(
  text: string,
  opts: { rate?: number; pitch?: number; lang?: string } = {},
): void {
  say(text, opts.lang && /^en/i.test(opts.lang) ? 'en-letter' : 'ru');
}
