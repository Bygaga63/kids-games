import { useEffect, useRef, useState } from 'react';
import { shuffle } from '@lib/random';
import { burstConfetti } from '@lib/confetti';
import './numbers.css';

const CONFETTI_COLORS = [
  '#12b886',
  '#3b6cf6',
  '#ffd43b',
  '#ff922b',
  '#ff5a7a',
  '#9775fa',
];

const LEVELS = [
  { n: 5, label: 'До 25' },
  { n: 7, label: 'До 49' },
  { n: 10, label: 'До 100' },
] as const;

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
}

type EndInfo = { ms: number; record: boolean; prev: number; total: number };

export default function NumbersGame() {
  const [n, setN] = useState(5);
  const [nums, setNums] = useState<number[]>(() =>
    shuffle(Array.from({ length: 25 }, (_, i) => i + 1)),
  );
  const [expected, setExpected] = useState(1);
  const [done, setDone] = useState<Set<number>>(new Set());
  // счётчик по числу — перезапуск shake-анимации при повторном промахе
  const [wrongMarks, setWrongMarks] = useState<Record<number, number>>({});
  const [clock, setClock] = useState('0:00');
  const [end, setEnd] = useState<EndInfo | null>(null);
  const started = useRef<number | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  function build(newN: number) {
    const total = newN * newN;
    setExpected(1);
    setClock('0:00');
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    started.current = null;
    setDone(new Set());
    setWrongMarks({});
    setNums(shuffle(Array.from({ length: total }, (_, i) => i + 1)));
  }

  function tap(num: number) {
    if (done.has(num)) return;
    if (num !== expected) {
      setWrongMarks((m) => ({ ...m, [num]: (m[num] || 0) + 1 }));
      return;
    }
    if (!started.current) {
      started.current = Date.now();
      timer.current = window.setInterval(() => {
        setClock(fmt(Date.now() - (started.current as number)));
      }, 250);
    }
    const newDone = new Set(done);
    newDone.add(num);
    setDone(newDone);
    const total = n * n;
    if (expected + 1 > total) {
      finish();
    } else {
      setExpected(expected + 1);
    }
  }

  function finish() {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    const ms = Date.now() - (started.current as number);
    const total = n * n;
    const key = 'iu:time:numbers:' + n;
    const prev = parseInt(localStorage.getItem(key) || '0', 10);
    const record = !prev || ms < prev;
    if (record) localStorage.setItem(key, String(ms));
    localStorage.setItem('iu:played:numbers', '1');
    setEnd({ ms, record, prev, total });
    burstConfetti(CONFETTI_COLORS);
  }

  function again() {
    setEnd(null);
    build(n);
  }

  function setLevel(newN: number) {
    setN(newN);
    build(newN);
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
        <span className="title">Найди число</span>
        <span className="spacer" />
        <span className="chip">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="13" r="8" />
            <path d="M12 13V9M12 5V3M9 3h6" />
          </svg>
          <span>{clock}</span>
        </span>
      </header>

      <main className="stage">
        {!end && (
          <>
            <div className="levels playing">
              {LEVELS.map((l) => (
                <button
                  key={l.n}
                  className="lvl"
                  type="button"
                  aria-pressed={n === l.n}
                  onClick={() => setLevel(l.n)}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div className="find playing">
              Найди <b>{expected}</b> — нажимай числа по порядку
            </div>
            <div
              className="board playing"
              style={{
                gridTemplateColumns: `repeat(${n},1fr)`,
                fontSize: `clamp(15px,${(7.5 / n) * 4}vw,${46 - n * 2.4}px)`,
              }}
            >
              {nums.map((num) => (
                <button
                  key={`${num}:${wrongMarks[num] || 0}`}
                  className={
                    'cell' +
                    (done.has(num) ? ' done' : '') +
                    (wrongMarks[num] ? ' wrong' : '')
                  }
                  type="button"
                  onClick={() => tap(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </>
        )}

        {end && (
          <div className="end show">
            <div className="big">
              {end.record ? 'Новый рекорд!' : 'Готово!'}
            </div>
            <div className="time">{fmt(end.ms)}</div>
            <div className="res">
              Числа до {end.total}
              {end.prev && !end.record ? ' · рекорд ' + fmt(end.prev) : ''}
            </div>
            <button className="btn" type="button" onClick={again}>
              Ещё раз
            </button>
          </div>
        )}
      </main>
    </>
  );
}
