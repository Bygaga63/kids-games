import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './odd-one-out.css';

type Item = { e: string; n: string };
type Cat = { one: string; many: string; items: Item[] };

// группы: one — «это …», many — «остальное — …»
const CATS: Cat[] = [
  {
    one: 'овощ',
    many: 'овощи',
    items: [
      { e: '🥕', n: 'Морковка' },
      { e: '🥒', n: 'Огурец' },
      { e: '🥬', n: 'Капуста' },
      { e: '🧅', n: 'Лук' },
      { e: '🍆', n: 'Баклажан' },
      { e: '🌽', n: 'Кукуруза' },
    ],
  },
  {
    one: 'фрукт',
    many: 'фрукты',
    items: [
      { e: '🍎', n: 'Яблоко' },
      { e: '🍌', n: 'Банан' },
      { e: '🍐', n: 'Груша' },
      { e: '🍊', n: 'Апельсин' },
      { e: '🍇', n: 'Виноград' },
      { e: '🍓', n: 'Клубника' },
    ],
  },
  {
    one: 'зверь',
    many: 'звери',
    items: [
      { e: '🦊', n: 'Лиса' },
      { e: '🐻', n: 'Медведь' },
      { e: '🐺', n: 'Волк' },
      { e: '🐰', n: 'Заяц' },
      { e: '🦁', n: 'Лев' },
      { e: '🐯', n: 'Тигр' },
    ],
  },
  {
    one: 'птица',
    many: 'птицы',
    items: [
      { e: '🦉', n: 'Сова' },
      { e: '🦆', n: 'Утка' },
      { e: '🐔', n: 'Курица' },
      { e: '🦢', n: 'Лебедь' },
      { e: '🐧', n: 'Пингвин' },
      { e: '🦜', n: 'Попугай' },
    ],
  },
  {
    one: 'рыба',
    many: 'рыбы',
    items: [
      { e: '🐟', n: 'Рыба' },
      { e: '🐠', n: 'Пёстрая рыбка' },
      { e: '🐡', n: 'Рыба-ёж' },
      { e: '🦈', n: 'Акула' },
    ],
  },
  {
    one: 'транспорт',
    many: 'транспорт',
    items: [
      { e: '🚗', n: 'Машина' },
      { e: '🚌', n: 'Автобус' },
      { e: '🚂', n: 'Поезд' },
      { e: '✈️', n: 'Самолёт' },
      { e: '🚲', n: 'Велосипед' },
      { e: '🚁', n: 'Вертолёт' },
    ],
  },
  {
    one: 'одежда',
    many: 'одежда',
    items: [
      { e: '👕', n: 'Футболка' },
      { e: '👖', n: 'Штаны' },
      { e: '🧦', n: 'Носки' },
      { e: '🧢', n: 'Кепка' },
      { e: '🧥', n: 'Куртка' },
      { e: '👗', n: 'Платье' },
    ],
  },
  {
    one: 'цветок',
    many: 'цветы',
    items: [
      { e: '🌹', n: 'Роза' },
      { e: '🌻', n: 'Подсолнух' },
      { e: '🌷', n: 'Тюльпан' },
      { e: '🌼', n: 'Ромашка' },
    ],
  },
  {
    one: 'насекомое',
    many: 'насекомые',
    items: [
      { e: '🐝', n: 'Пчела' },
      { e: '🦋', n: 'Бабочка' },
      { e: '🐞', n: 'Божья коровка' },
      { e: '🐜', n: 'Муравей' },
    ],
  },
  {
    one: 'музыкальный инструмент',
    many: 'музыкальные инструменты',
    items: [
      { e: '🎸', n: 'Гитара' },
      { e: '🥁', n: 'Барабан' },
      { e: '🎻', n: 'Скрипка' },
      { e: '🎺', n: 'Труба' },
    ],
  },
  {
    one: 'инструмент',
    many: 'инструменты',
    items: [
      { e: '🔨', n: 'Молоток' },
      { e: '🪚', n: 'Пила' },
      { e: '🔧', n: 'Гаечный ключ' },
      { e: '✂️', n: 'Ножницы' },
    ],
  },
  {
    one: 'сладость',
    many: 'сладости',
    items: [
      { e: '🍰', n: 'Торт' },
      { e: '🍦', n: 'Мороженое' },
      { e: '🍪', n: 'Печенье' },
      { e: '🍭', n: 'Леденец' },
    ],
  },
  {
    one: 'посуда',
    many: 'посуда',
    items: [
      { e: '🥄', n: 'Ложка' },
      { e: '🍴', n: 'Вилка' },
      { e: '☕', n: 'Чашка' },
      { e: '🫖', n: 'Чайник' },
    ],
  },
  {
    one: 'игрушка',
    many: 'игрушки',
    items: [
      { e: '🧸', n: 'Мишка' },
      { e: '⚽', n: 'Мяч' },
      { e: '🪁', n: 'Воздушный змей' },
      { e: '🎲', n: 'Кубик' },
    ],
  },
];

const ROUNDS = 10;
const CONFETTI_COLORS = [
  '#f59f00',
  '#ffd43b',
  '#12b886',
  '#3b6cf6',
  '#ff5a7a',
  '#7048e8',
];

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

type Question = { cards: Item[]; odd: Item; oddOne: string; mainMany: string };
type Toast = { b: string; rest: string; kind: 'good' | 'bad' };

export default function OddOneOutGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [wrong, setWrong] = useState<{ idx: number; k: number } | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showNext, setShowNext] = useState(false);
  const [barRound, setBarRound] = useState(0);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [finalStars, setFinalStars] = useState(0);
  const mistakes = useRef(0);
  const lastPair = useRef('');

  useEffect(() => {
    syncWallet();
    next(0);
  }, []);

  function next(curRound: number) {
    setLocked(false);
    mistakes.current = 0;
    setShowNext(false);
    setToast(null);
    setPickedIdx(null);
    setWrong(null);

    // две разные группы; не повторяем пару из прошлого раунда
    let A: Cat, B: Cat, pairKey: string;
    do {
      const two = shuffle(CATS).slice(0, 2);
      A = two[0];
      B = two[1];
      pairKey = A.many + '|' + B.many;
    } while (pairKey === lastPair.current);
    lastPair.current = pairKey;

    const main = shuffle(A.items).slice(0, 3);
    const odd = shuffle(B.items)[0];
    const cards = shuffle(main.concat([odd]));
    setQuestion({ cards, odd, oddOne: B.one, mainMany: A.many });
    setBarRound(curRound);
  }

  function choose(idx: number) {
    if (locked || !question) return;
    const it = question.cards[idx];
    if (it.n !== question.odd.n) {
      mistakes.current++;
      setWrong((w) => ({ idx, k: (w?.k ?? 0) + 1 }));
      sfx(false);
      setToast({
        b: 'Подумай ещё!',
        rest: it.n + ' дружит с другими картинками.',
        kind: 'bad',
      });
      return;
    }
    setLocked(true);
    setPickedIdx(idx);
    sfx(true);
    addCoins(1);
    if (mistakes.current === 0) setScore((s) => s + 1);
    setToast({
      b: 'Верно!',
      rest:
        question.odd.n +
        ' — это ' +
        question.oddOne +
        ', а остальное — ' +
        question.mainMany +
        '!',
      kind: 'good',
    });
    setRound(round + 1);
    setShowNext(true);
  }

  function finish() {
    setBarRound(ROUNDS);
    setFinished(true);
    const stars = score >= 10 ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;
    setFinalStars(stars);
    for (let i = 0; i < stars; i++) {
      setTimeout(() => setStarsOn(i + 1), 200 + i * 220);
    }
    if (stars >= 1) burstConfetti(CONFETTI_COLORS);
    saveBest('odd', score);
  }

  function again() {
    setRound(0);
    setScore(0);
    lastPair.current = '';
    setFinished(false);
    setStarsOn(0);
    setFinalStars(0);
    next(0);
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
        <span className="title">Убери лишнее</span>
        <span className="spacer" />
        <span className="score">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
            {STAR}
          </svg>
          <span>{score}</span>
        </span>
      </header>

      <main className="stage">
        {!finished && (
          <div className="progress playing">
            <i style={{ width: `${(barRound / ROUNDS) * 100}%` }} />
          </div>
        )}

        {!finished && question && (
          <div
            className="playing"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(12px,3vw,20px)',
            }}
          >
            <div className="lead">
              Три картинки дружат, а одна — лишняя. Найди её!
            </div>
            <div className="cards">
              {question.cards.map((it, idx) => (
                <button
                  key={`${idx}:${wrong && wrong.idx === idx ? wrong.k : 0}`}
                  type="button"
                  className={
                    'pick' +
                    (locked && idx === pickedIdx ? ' correct' : '') +
                    (locked && idx !== pickedIdx ? ' dim' : '') +
                    (wrong && wrong.idx === idx ? ' wrong' : '')
                  }
                  disabled={locked}
                  onClick={() => choose(idx)}
                >
                  <span className="e">{it.e}</span>
                  <span className="n">{it.n}</span>
                </button>
              ))}
            </div>
            <div className={'toast' + (toast ? ' ' + toast.kind : '')}>
              {toast && (
                <>
                  <b>{toast.b}</b> {toast.rest}
                </>
              )}
            </div>
            {showNext && (
              <button
                className="btn next"
                type="button"
                onClick={() => (round >= ROUNDS ? finish() : next(round))}
              >
                <span>{round >= ROUNDS ? 'Смотреть результат' : 'Дальше'}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            )}
          </div>
        )}

        {finished && (
          <div className="end show">
            <div className="stars">
              {[0, 1, 2].map((i) => (
                <svg
                  key={i}
                  viewBox="0 0 24 24"
                  className={i < starsOn ? 'on' : ''}
                  fill="currentColor"
                >
                  {STAR}
                </svg>
              ))}
            </div>
            <div className="big">
              {finalStars === 3
                ? 'Мастер логики!'
                : finalStars >= 1
                  ? 'Молодец!'
                  : 'Попробуй ещё!'}
            </div>
            <div className="res">
              Без ошибок: {score} из {ROUNDS}
            </div>
            <button className="btn" type="button" onClick={again}>
              Играть снова
            </button>
          </div>
        )}
      </main>
    </>
  );
}
