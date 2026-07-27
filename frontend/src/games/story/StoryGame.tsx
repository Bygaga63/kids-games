import { useEffect, useRef, useState } from 'react';
import { shuffle } from '@lib/random';
import { burstConfetti } from '@lib/confetti';
import './story.css';

type Card = { e: string; n: string };

// 100 картинок: герои, звери, места, транспорт, волшебные предметы, еда
const CARDS: Card[] = [
  { e: '👑', n: 'Король' },
  { e: '👸', n: 'Принцесса' },
  { e: '🧙‍♂️', n: 'Волшебник' },
  { e: '🧚', n: 'Фея' },
  { e: '🧜‍♀️', n: 'Русалка' },
  { e: '🧞', n: 'Джинн' },
  { e: '🦸', n: 'Супергерой' },
  { e: '🥷', n: 'Ниндзя' },
  { e: '🤖', n: 'Робот' },
  { e: '👽', n: 'Инопланетянин' },
  { e: '🤡', n: 'Клоун' },
  { e: '👻', n: 'Привидение' },
  { e: '🎅', n: 'Дед Мороз' },
  { e: '🧑‍🚀', n: 'Космонавт' },
  { e: '🕵️', n: 'Сыщик' },
  { e: '👮', n: 'Полицейский' },
  { e: '🧑‍🚒', n: 'Пожарный' },
  { e: '🧑‍🍳', n: 'Повар' },
  { e: '🤴', n: 'Принц' },
  { e: '🧝', n: 'Эльф' },
  { e: '🐉', n: 'Дракон' },
  { e: '🦄', n: 'Единорог' },
  { e: '🐺', n: 'Волк' },
  { e: '🦊', n: 'Лиса' },
  { e: '🐻', n: 'Медведь' },
  { e: '🐰', n: 'Заяц' },
  { e: '🦁', n: 'Лев' },
  { e: '🐘', n: 'Слон' },
  { e: '🐒', n: 'Обезьянка' },
  { e: '🐧', n: 'Пингвин' },
  { e: '🦉', n: 'Сова' },
  { e: '🐬', n: 'Дельфин' },
  { e: '🐳', n: 'Кит' },
  { e: '🐢', n: 'Черепаха' },
  { e: '🐿️', n: 'Белка' },
  { e: '🦔', n: 'Ёжик' },
  { e: '🐱', n: 'Котёнок' },
  { e: '🐶', n: 'Щенок' },
  { e: '🐴', n: 'Лошадка' },
  { e: '🦖', n: 'Динозавр' },
  { e: '🏰', n: 'Замок' },
  { e: '🌋', n: 'Вулкан' },
  { e: '🏝️', n: 'Остров' },
  { e: '🌲', n: 'Лес' },
  { e: '⛰️', n: 'Горы' },
  { e: '🏖️', n: 'Пляж' },
  { e: '🏜️', n: 'Пустыня' },
  { e: '🌊', n: 'Море' },
  { e: '🌙', n: 'Луна' },
  { e: '⭐', n: 'Звезда' },
  { e: '🌈', n: 'Радуга' },
  { e: '🏠', n: 'Домик' },
  { e: '🎪', n: 'Цирк' },
  { e: '🗼', n: 'Башня' },
  { e: '🌉', n: 'Мост' },
  { e: '🚀', n: 'Ракета' },
  { e: '🚂', n: 'Поезд' },
  { e: '⛵', n: 'Кораблик' },
  { e: '🚁', n: 'Вертолёт' },
  { e: '🎈', n: 'Воздушный шар' },
  { e: '🚲', n: 'Велосипед' },
  { e: '🛸', n: 'НЛО' },
  { e: '🚗', n: 'Машина' },
  { e: '🛶', n: 'Лодка' },
  { e: '🛹', n: 'Скейт' },
  { e: '🗝️', n: 'Ключ' },
  { e: '🗺️', n: 'Карта' },
  { e: '💎', n: 'Алмаз' },
  { e: '🎁', n: 'Подарок' },
  { e: '🪄', n: 'Волшебная палочка' },
  { e: '🔮', n: 'Волшебный шар' },
  { e: '🧪', n: 'Зелье' },
  { e: '📜', n: 'Свиток' },
  { e: '📖', n: 'Книга сказок' },
  { e: '🛡️', n: 'Щит' },
  { e: '🎩', n: 'Шляпа' },
  { e: '💍', n: 'Кольцо' },
  { e: '🪞', n: 'Зеркало' },
  { e: '⏰', n: 'Будильник' },
  { e: '🔦', n: 'Фонарик' },
  { e: '🧭', n: 'Компас' },
  { e: '☂️', n: 'Зонтик' },
  { e: '🎨', n: 'Краски' },
  { e: '🎻', n: 'Скрипка' },
  { e: '🥁', n: 'Барабан' },
  { e: '🪁', n: 'Воздушный змей' },
  { e: '⚽', n: 'Мяч' },
  { e: '🧸', n: 'Мишка' },
  { e: '🏆', n: 'Кубок' },
  { e: '💌', n: 'Письмо' },
  { e: '🍰', n: 'Торт' },
  { e: '🍎', n: 'Яблоко' },
  { e: '🍯', n: 'Мёд' },
  { e: '🍄', n: 'Гриб' },
  { e: '🥕', n: 'Морковка' },
  { e: '🍕', n: 'Пицца' },
  { e: '🍦', n: 'Мороженое' },
  { e: '🍪', n: 'Печенье' },
  { e: '☀️', n: 'Солнце' },
  { e: '❄️', n: 'Снежинка' },
];

const PICKS = 8;
const SPIN_MS = 5000;

type Phase = 'idle' | 'spinning' | 'done';

export default function StoryGame() {
  const [deck, setDeck] = useState<Card[]>(() => CARDS.slice());
  const [slots, setSlots] = useState<(Card | null)[]>(() =>
    Array<Card | null>(PICKS).fill(null),
  );
  const [hot, setHot] = useState(-1);
  const [picked, setPicked] = useState<number[]>([]);
  const [dimmed, setDimmed] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [mixKey, setMixKey] = useState(0); // >0 — рестарт анимации перемешивания
  const [hadRun, setHadRun] = useState(false); // после первой истории кнопка меняет текст
  const spinningRef = useRef(false);
  const pickedRef = useRef<Set<number>>(new Set());
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => clearTimeout(t));
    },
    [],
  );

  function spin() {
    if (spinningRef.current) return;
    spinningRef.current = true;
    setPhase('spinning');

    // новая история — карточки меняют позиции
    const newDeck = shuffle(CARDS);
    setDeck(newDeck);
    setMixKey((k) => k + 1);
    setSlots(Array<Card | null>(PICKS).fill(null));
    pickedRef.current = new Set();
    setPicked([]);
    setDimmed(false);
    setHot(-1);

    // 8 разных случайных позиций
    const order = shuffle(newDeck.map((_, i) => i));
    const picks = order.slice(0, PICKS);
    const start = Date.now();
    let locked = 0;

    function hop() {
      if (locked >= PICKS) return;
      // прыгаем по свободным клеткам
      let i: number;
      do {
        i = Math.floor(Math.random() * newDeck.length);
      } while (pickedRef.current.has(i));
      setHot(i);
      const el = Date.now() - start;
      const d = 60 + Math.min(1, el / SPIN_MS) * 130; // рулетка постепенно замедляется
      timers.current.push(window.setTimeout(hop, d));
    }

    function lock() {
      const idx = picks[locked];
      pickedRef.current.add(idx);
      setPicked(Array.from(pickedRef.current));
      setHot((h) => (h === idx ? -1 : h));
      const slotI = locked;
      setSlots((prev) => {
        const n = prev.slice();
        n[slotI] = newDeck[idx];
        return n;
      });
      locked++;
      if (locked < PICKS) {
        timers.current.push(window.setTimeout(lock, SPIN_MS / PICKS));
      } else {
        finishSpin();
      }
    }

    function finishSpin() {
      spinningRef.current = false;
      setHot(-1);
      setDimmed(true);
      setPhase('done');
      setHadRun(true);
      burstConfetti(
        ['#5f3dc4', '#845ef7', '#12b886', '#ffd43b', '#ff5a7a', '#ff922b'],
        50,
      );
    }

    hop();
    timers.current.push(window.setTimeout(lock, SPIN_MS / PICKS));
  }

  return (
    <>
      <header className="bar">
        <a className="back" href="/">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Игры
        </a>
        <span className="title">Создай историю</span>
        <span className="spacer" />
        <span className="count">8 картинок из 100</span>
      </header>

      <main className="stage">
        <div className="strip">
          {slots.map((card, i) => (
            <div key={i} className={'slot' + (card ? ' filled' : '')}>
              <span className="num">{i + 1}</span>
              <span className="e">{card?.e ?? ''}</span>
              <span className="t">{card?.n ?? ''}</span>
            </div>
          ))}
        </div>

        <div className="lead">
          {phase === 'idle' &&
            'Нажми «Создать» — рулетка выберет 8 картинок для твоей истории'}
          {phase === 'spinning' &&
            'Рулетка крутится… кто попадёт в твою историю?'}
          {phase === 'done' && (
            <>
              <b>Готово!</b> Расскажи историю по картинкам 1–8. Начни со слов
              «Жил-был…»
            </>
          )}
        </div>

        <button
          className="btn"
          type="button"
          disabled={phase === 'spinning'}
          onClick={spin}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3l1.9 4.6L18 9.5l-4.1 1.9L12 16l-1.9-4.6L6 9.5l4.1-1.9z" />
            <path d="M18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
          </svg>
          <span>{hadRun ? 'Новая история' : 'Создать'}</span>
        </button>

        <div key={mixKey} className={'grid' + (mixKey > 0 ? ' shuffling' : '')}>
          {deck.map((c, i) => {
            const isPicked = picked.includes(i);
            return (
              <div
                key={i}
                className={
                  'tile' +
                  (hot === i && !isPicked ? ' hot' : '') +
                  (isPicked ? ' picked' : '') +
                  (dimmed && !isPicked ? ' dim' : '')
                }
              >
                {c.e}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
