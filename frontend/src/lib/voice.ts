// Озвучка предзаписанными нейро-клипами (edge-tts, см. scripts/generate-voice.mjs).
// Клип ищется по детерминированному имени = hash(голос|скорость|текст); если файла
// нет (новая фраза, ещё не сгенерирована) — фолбэк на браузерный speechSynthesis.

export type VoiceKind = 'ru' | 'ru-letter' | 'en-letter';

// ВАЖНО: те же значения захардкожены в scripts/generate-voice.mjs — менять синхронно.
const PRESETS: Record<
  VoiceKind,
  {
    voice: string;
    rate: string;
    fbLang: string;
    fbRate: number;
    fbPitch: number;
    fbVoice: RegExp;
  }
> = {
  ru: {
    voice: 'ru-RU-DmitryNeural',
    rate: '-10%',
    fbLang: 'ru-RU',
    fbRate: 0.92,
    fbPitch: 1.05,
    fbVoice: /ru/i,
  },
  'ru-letter': {
    voice: 'ru-RU-DmitryNeural',
    rate: '-25%',
    fbLang: 'ru-RU',
    fbRate: 0.8,
    fbPitch: 1.15,
    fbVoice: /ru/i,
  },
  'en-letter': {
    voice: 'en-US-JennyNeural',
    rate: '-25%',
    fbLang: 'en-US',
    fbRate: 0.8,
    fbPitch: 1.1,
    fbVoice: /en[-_]/i,
  },
};

/** Детерминированное имя файла клипа (двойной djb2/xor, как в generate-voice.mjs). */
export function voiceSlug(s: string): string {
  let h1 = 5381;
  let h2 = 52711;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1, 33) ^ c;
    h2 = Math.imul(h2, 33) ^ c;
  }
  return (h1 >>> 0).toString(36) + '-' + (h2 >>> 0).toString(36);
}

export function voiceFile(text: string, kind: VoiceKind = 'ru'): string {
  const p = PRESETS[kind];
  return (
    '/assets/voice/' + voiceSlug(p.voice + '|' + p.rate + '|' + text) + '.mp3'
  );
}

let current: HTMLAudioElement | null = null;

/** Остановить текущую озвучку (клип и/или синтез). */
export function stopVoice(): void {
  if (current) {
    try {
      current.pause();
    } catch {}
    current = null;
  }
  try {
    window.speechSynthesis?.cancel();
  } catch {}
}

function fallbackSpeak(text: string, kind: VoiceKind): void {
  try {
    if (!('speechSynthesis' in window)) return;
    const p = PRESETS[kind];
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = p.fbLang;
    u.rate = p.fbRate;
    u.pitch = p.fbPitch;
    const v = window.speechSynthesis
      .getVoices()
      .filter((vc) => p.fbVoice.test(vc.lang))[0];
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch {}
}

/** Произнести фразу: предзаписанный клип, при его отсутствии — speechSynthesis. */
export function say(text: string, kind: VoiceKind = 'ru'): void {
  stopVoice();
  try {
    const a = new Audio(voiceFile(text, kind));
    current = a;
    a.play().catch(() => {
      if (current === a) current = null;
      fallbackSpeak(text, kind);
    });
  } catch {
    fallbackSpeak(text, kind);
  }
}
