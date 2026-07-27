import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './add-10.css';

type Pair = { a: number; b: number };

const ROUNDS = 10;
const CONFETTI_COLORS = [
  '#f76707',
  '#3b6cf6',
  '#12b886',
  '#ffd43b',
  '#ff5a7a',
  '#7048e8',
];

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

// все пары a+b со суммой не больше 10
function buildDeck(): Pair[] {
  const all: Pair[] = [];
  for (let a = 1; a <= 9; a++)
    for (let b = 1; b <= 10 - a; b++) all.push({ a, b });
  return shuffle(all);
}

export default function Add10Game() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [ans, setAns] = useState('');
  const [cur, setCur] = useState<Pair | null>(null);
  const [result, setResult] = useState<'ok' | 'no' | null>(null);
  const [toast, setToast] = useState<{
    text: string;
    kind: 'good' | 'bad';
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [taskKey, setTaskKey] = useState(0); // перезапуск pop-анимации
  const queue = useRef<Pair[]>([]);

  // актуальные значения для клавиатурного ввода
  const stateRef = useRef({ locked, ans, finished, cur, round, score });
  stateRef.current = { locked, ans, finished, cur, round, score };

  useEffect(() => {
    syncWallet();
    next();
  }, []);

  function next() {
    setLocked(false);
    setAns('');
    setResult(null);
    setToast(null);
    if (queue.current.length === 0) queue.current = buildDeck();
    setCur(queue.current.shift()!);
    setTaskKey((k) => k + 1);
  }

  function press(d: string) {
    const s = stateRef.current;
    if (s.locked || s.ans.length >= 2) return;
    setAns(s.ans + d);
  }

  function del() {
    const s = stateRef.current;
    if (!s.locked && s.ans !== '') setAns(s.ans.slice(0, -1));
  }

  function check() {
    const s = stateRef.current;
    if (s.locked || s.ans === '' || !s.cur) return;
    setLocked(true);
    const v = parseInt(s.ans, 10);
    const right = s.cur.a + s.cur.b;
    let newScore = s.score;
    if (v === right) {
      setResult('ok');
      addCoins(1);
      newScore = s.score + 1;
      setScore(newScore);
      setToast({
        text: 'Верно! ' + s.cur.a + ' + ' + s.cur.b + ' = ' + right,
        kind: 'good',
      });
    } else {
      setResult('no');
      setToast({
        text: 'Правильный ответ: ' + s.cur.a + ' + ' + s.cur.b + ' = ' + right,
        kind: 'bad',
      });
    }
    const newRound = s.round + 1;
    setRound(newRound);
    setTimeout(
      () => {
        if (newRound >= ROUNDS) finish(newScore);
        else next();
      },
      v === right ? 1000 : 1800,
    );
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stateRef.current.finished) return;
      if (e.key >= '0' && e.key <= '9') press(e.key);
      else if (e.key === 'Backspace') del();
      else if (e.key === 'Enter') check();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish(finalScore: number) {
    setFinished(true);
    const stars =
      finalScore >= 10 ? 3 : finalScore >= 7 ? 2 : finalScore >= 4 ? 1 : 0;
    for (let i = 0; i < stars; i++) {
      setTimeout(() => setStarsOn(i + 1), 200 + i * 220);
    }
    if (stars >= 1) burstConfetti(CONFETTI_COLORS, 70);
    saveBest('add10', finalScore);
  }

  function again() {
    setRound(0);
    setScore(0);
    queue.current = [];
    setFinished(false);
    setStarsOn(0);
    next();
  }

  const endStars = score >= 10 ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;

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
        <span className="title">Сложение до 10</span>
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
            <i style={{ width: `${(round / ROUNDS) * 100}%` }} />
          </div>
        )}

        {!finished && cur && (
          <div
            className="playing"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(12px,3vw,20px)',
            }}
          >
            <div className="lead">Реши пример — набери ответ на кнопках</div>
            <div key={taskKey} className="task pop">
              <div className="eq">
                <span>{cur.a}</span>
                <span className="sign">+</span>
                <span>{cur.b}</span>
                <span className="sign">=</span>
                <span
                  className={
                    'slot' +
                    (ans !== '' ? ' filled' : '') +
                    (result === 'ok' ? ' ok' : result === 'no' ? ' no' : '')
                  }
                >
                  {ans === '' ? '?' : ans}
                </span>
              </div>
              <div className="dots" aria-hidden="true">
                <span className="grp g1">
                  {Array.from({ length: cur.a }, (_, i) => (
                    <i key={i} />
                  ))}
                </span>
                <span className="plus">+</span>
                <span className="grp g2">
                  {Array.from({ length: cur.b }, (_, i) => (
                    <i key={i} />
                  ))}
                </span>
              </div>
            </div>
            <div className={'toast' + (toast ? ' ' + toast.kind : '')}>
              {toast?.text ?? ''}
            </div>
            <div className="pad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button
                  key={d}
                  className="key"
                  type="button"
                  disabled={locked}
                  onClick={() => press(d)}
                >
                  {d}
                </button>
              ))}
              <button
                className="key fn"
                type="button"
                aria-label="Стереть"
                disabled={locked}
                onClick={del}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 6H8l-5 6 5 6h13a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z" />
                  <path d="M12 9l6 6M18 9l-6 6" />
                </svg>
              </button>
              <button
                className="key"
                type="button"
                disabled={locked}
                onClick={() => press('0')}
              >
                0
              </button>
              <button
                className="key go"
                type="button"
                aria-label="Проверить"
                disabled={locked}
                onClick={check}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12.5 9.5 18 20 6.5" />
                </svg>
              </button>
            </div>
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
              {endStars === 3
                ? 'Мастер сложения!'
                : endStars >= 1
                  ? 'Молодец!'
                  : 'Попробуй ещё!'}
            </div>
            <div className="res">
              Правильно {score} из {ROUNDS}
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
