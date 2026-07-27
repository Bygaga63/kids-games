import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './memo.css';

type Animal = { img: string; n: string };

// фото зверей — из assets/animals (уже в проекте)
const ANIMALS: Animal[] = [
  { img: '/assets/animals/lisa.jpg', n: 'Лиса' },
  { img: '/assets/animals/tigr.jpg', n: 'Тигр' },
  { img: '/assets/animals/lev.jpg', n: 'Лев' },
  { img: '/assets/animals/panda.jpg', n: 'Панда' },
  { img: '/assets/animals/koala.jpg', n: 'Коала' },
  { img: '/assets/animals/zebra.jpg', n: 'Зебра' },
  { img: '/assets/animals/zhiraf.jpg', n: 'Жираф' },
  { img: '/assets/animals/slon.jpg', n: 'Слон' },
  { img: '/assets/animals/zayats.jpg', n: 'Заяц' },
  { img: '/assets/animals/pingvin.jpg', n: 'Пингвин' },
  { img: '/assets/animals/delfin.jpg', n: 'Дельфин' },
  { img: '/assets/animals/gepard.jpg', n: 'Гепард' },
];

const CONFETTI_COLORS = [
  '#0ca678',
  '#38d9a9',
  '#ffd43b',
  '#ff5a7a',
  '#3b6cf6',
  '#ff922b',
];

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

const PAW = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="7.2" cy="7.6" r="1.5" />
    <circle cx="12" cy="6.4" r="1.5" />
    <circle cx="16.8" cy="7.6" r="1.5" />
    <path d="M12 11c-3.1 0-5.6 2.3-5.6 4.8 0 1.7 1.3 3 2.9 3 1 0 1.8-.4 2.7-.4s1.7.4 2.7.4c1.6 0 2.9-1.3 2.9-3 0-2.5-2.5-4.8-5.6-4.8z" />
  </svg>
);

type CardState = 'closed' | 'open' | 'done';
type Lead =
  { kind: 'default' } | { kind: 'pair'; name: string } | { kind: 'empty' };

function makeDeck(pairs: number): Animal[] {
  const chosen = shuffle(ANIMALS).slice(0, pairs);
  return shuffle(chosen.concat(chosen).map((a) => ({ img: a.img, n: a.n })));
}

export default function MemoGame() {
  const [pairs, setPairs] = useState(6);
  const [deck, setDeck] = useState<Animal[]>(() => makeDeck(6));
  const [states, setStates] = useState<CardState[]>(() =>
    new Array(12).fill('closed'),
  );
  const [moves, setMoves] = useState(0);
  const [found, setFound] = useState(0);
  const [lead, setLead] = useState<Lead>({ kind: 'default' });
  const [ended, setEnded] = useState(false);
  const [starsOn, setStarsOn] = useState(0);

  const first = useRef<{ idx: number; data: Animal } | null>(null);
  const lock = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    syncWallet(); // синхронизируем кошелёк при входе на страницу
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function newGame(p: number) {
    first.current = null;
    lock.current = false;
    setMoves(0);
    setFound(0);
    setEnded(false);
    setStarsOn(0);
    setLead({ kind: 'default' });
    setDeck(makeDeck(p));
    setStates(new Array(p * 2).fill('closed'));
  }

  function flip(idx: number) {
    if (lock.current || states[idx] === 'open' || states[idx] === 'done')
      return;
    setStates((s) => {
      const next = s.slice();
      next[idx] = 'open';
      return next;
    });
    if (!first.current) {
      first.current = { idx, data: deck[idx] };
      return;
    }
    // второй ход
    const newMoves = moves + 1;
    setMoves(newMoves);
    const a = first.current.idx;
    const b = idx;
    if (first.current.data.n === deck[idx].n) {
      const name = deck[idx].n;
      first.current = null;
      later(() => {
        setStates((s) => {
          const next = s.slice();
          next[a] = 'done';
          next[b] = 'done';
          return next;
        });
        const newFound = found + 1;
        setFound(newFound);
        addCoins(1);
        setLead({ kind: 'pair', name });
        if (newFound >= pairs) finish(newMoves, newFound);
      }, 420);
    } else {
      lock.current = true;
      first.current = null;
      later(() => {
        setStates((s) => {
          const next = s.slice();
          next[a] = 'closed';
          next[b] = 'closed';
          return next;
        });
        lock.current = false;
      }, 950);
    }
  }

  function finish(finalMoves: number, finalFound: number) {
    // звёзды за экономность: идеал — по ходу на пару
    const stars =
      finalMoves <= Math.ceil(pairs * 1.5)
        ? 3
        : finalMoves <= Math.ceil(pairs * 2.2)
          ? 2
          : 1;
    for (let i = 0; i < stars; i++) {
      later(() => setStarsOn(i + 1), 250 + i * 220);
    }
    setEnded(true);
    setLead({ kind: 'empty' });
    burstConfetti(CONFETTI_COLORS);
    saveBest('memo', finalFound);
  }

  const stars =
    moves <= Math.ceil(pairs * 1.5)
      ? 3
      : moves <= Math.ceil(pairs * 2.2)
        ? 2
        : 1;

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
        <span className="title">Мемо с животными</span>
        <span className="spacer" />
        <span className="chip">
          <span>{moves}</span>&nbsp;<small>ходов</small>
        </span>
        <span className="chip">
          <span>{found}</span>/<span>{pairs}</span>&nbsp;<small>пар</small>
        </span>
      </header>

      <main className="stage">
        <div className="seg" role="group" aria-label="Сложность">
          {[6, 8, 12].map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={pairs === p}
              onClick={() => {
                setPairs(p);
                newGame(p);
              }}
            >
              {p} пар
            </button>
          ))}
        </div>

        <div className="lead">
          {lead.kind === 'default' &&
            'Открывай по две карточки и находи одинаковых зверей'}
          {lead.kind === 'pair' && (
            <>
              <b>Пара!</b> {lead.name}
            </>
          )}
        </div>

        <div className={'board ' + (pairs === 12 ? 'c6' : 'c4')}>
          {deck.map((card, idx) => (
            <div
              key={idx}
              className={
                'cardm' +
                (states[idx] === 'open' ? ' open' : '') +
                (states[idx] === 'done' ? ' done' : '')
              }
              onClick={() => flip(idx)}
            >
              <div className="in">
                <div className="b" aria-hidden="true">
                  {PAW}
                </div>
                <div className="f">
                  <img src={card.img} alt={card.n} />
                  <span>{card.n}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={'end' + (ended ? ' show' : '')}>
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
            {stars === 3
              ? 'Суперпамять!'
              : stars === 2
                ? 'Отличная память!'
                : 'Все пары найдены!'}
          </div>
          <div className="res">
            Нашёл {pairs} пар за {moves} ходов
          </div>
          <button className="btn" type="button" onClick={() => newGame(pairs)}>
            Играть снова
          </button>
        </div>
      </main>
    </>
  );
}
