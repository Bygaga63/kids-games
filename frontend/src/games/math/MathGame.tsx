import { useEffect, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './math.css';

const TOTAL = 10;
const CONFETTI_COLORS = [
  '#f59f00',
  '#3b6cf6',
  '#12b886',
  '#ff5a7a',
  '#9775fa',
  '#ffd43b',
];

type Level = 'easy' | 'mid' | 'hard';

const LEVELS: { lvl: Level; label: string }[] = [
  { lvl: 'easy', label: 'До 10' },
  { lvl: 'mid', label: 'До 20' },
  { lvl: 'hard', label: 'До 100' },
];

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

// rnd из оригинала: целое от 0 до n-1
function rnd(n: number): number {
  return Math.floor(Math.random() * n);
}

type Question = {
  a: number;
  b: number;
  op: string;
  ans: number;
  opts: number[];
};

function genQuestion(lvl: Level): Question {
  const max = lvl === 'easy' ? 10 : lvl === 'mid' ? 20 : 100;
  const minus = lvl === 'easy' ? Math.random() < 0.35 : Math.random() < 0.5;
  let a: number, b: number, op: string, res: number;
  if (minus) {
    a = rnd(max) + 1;
    b = rnd(a) + 0;
    res = a - b;
    op = '−';
  } else {
    res = 0;
    do {
      a = rnd(max - 1) + 1;
      b = rnd(max - a) + 1;
      res = a + b;
      op = '+';
    } while (res > max);
  }
  const opts = new Set<number>([res]);
  while (opts.size < 4) {
    const d = res + (rnd(7) - 3);
    if (d >= 0 && d !== res) opts.add(d);
  }
  return { a, b, op, ans: res, opts: shuffle(Array.from(opts)) };
}

export default function MathGame() {
  const [lvl, setLvl] = useState<Level>('easy');
  const [q, setQ] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [locked, setLocked] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    text: string;
    kind: 'good' | 'bad';
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);

  useEffect(() => {
    syncWallet();
    gen(lvl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function gen(level: Level) {
    setQuestion(genQuestion(level));
    setToast(null);
    setPicked(null);
    setLocked(false);
  }

  function choose(v: number) {
    if (locked || !question || finished) return;
    setLocked(true);
    setPicked(v);
    const correct = v === question.ans;
    let newScore = score;
    if (correct) {
      sfx(true);
      addCoins(1);
      newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      setToast({
        text: newStreak >= 3 ? 'Серия ' + newStreak + ' подряд!' : 'Правильно!',
        kind: 'good',
      });
    } else {
      sfx(false);
      setStreak(0);
      setToast({ text: 'Правильный ответ: ' + question.ans, kind: 'bad' });
    }
    const newQ = q + 1;
    setQ(newQ);
    setTimeout(
      () => {
        if (newQ >= TOTAL) finish(newScore);
        else gen(lvl);
      },
      correct ? 700 : 1200,
    );
  }

  function finish(finalScore: number) {
    setFinished(true);
    const stars =
      finalScore >= 10 ? 3 : finalScore >= 7 ? 2 : finalScore >= 4 ? 1 : 0;
    for (let i = 0; i < stars; i++) {
      setTimeout(() => setStarsOn(i + 1), 200 + i * 220);
    }
    if (stars >= 1) burstConfetti(CONFETTI_COLORS);
    saveBest('math', finalScore);
  }

  function reset() {
    setQ(0);
    setScore(0);
    setStreak(0);
  }

  function chooseLevel(level: Level) {
    setLvl(level);
    reset();
    gen(level);
  }

  function again() {
    reset();
    setFinished(false);
    setStarsOn(0);
    gen(lvl);
  }

  const stars = score >= 10 ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;

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
        <span className="title">Математика</span>
        <span className="spacer" />
        <div className="chips">
          <span className="chip streak" title="Подряд верных">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 3c1 4-2 5-2 8a3 3 0 0 0 6 0c0-1-.4-2-1-3 2 1 4 3 4 6a7 7 0 0 1-14 0c0-5 5-6 7-11z" />
            </svg>
            <span>{streak}</span>
          </span>
          <span className="chip">
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
              {STAR}
            </svg>
            <span>{score}</span>
          </span>
        </div>
      </header>

      <main className="stage">
        {!finished && (
          <div className="levels playing">
            {LEVELS.map((l) => (
              <button
                key={l.lvl}
                className="lvl"
                type="button"
                aria-pressed={lvl === l.lvl}
                onClick={() => chooseLevel(l.lvl)}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}

        {!finished && (
          <div className="progress playing">
            <i style={{ width: `${(q / TOTAL) * 100}%` }} />
          </div>
        )}

        {!finished && question && (
          <div
            className="playing"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(16px,4vw,28px)',
            }}
          >
            <div className="q">
              {question.a} <span className="eq">{question.op}</span>{' '}
              {question.b} <span className="eq">=</span> ?
            </div>
            <div className={'toast' + (toast ? ' ' + toast.kind : '')}>
              {toast?.text ?? ''}
            </div>
            <div className="opts">
              {question.opts.map((v) => (
                <button
                  key={v}
                  type="button"
                  disabled={locked}
                  className={
                    'opt' +
                    (locked && v === question.ans ? ' correct' : '') +
                    (locked && picked === v && v !== question.ans
                      ? ' wrong'
                      : '')
                  }
                  onClick={() => choose(v)}
                >
                  {v}
                </button>
              ))}
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
                  stroke="none"
                >
                  {STAR}
                </svg>
              ))}
            </div>
            <div className="big">
              {stars === 3
                ? 'Идеально!'
                : stars >= 1
                  ? 'Молодец!'
                  : 'Попробуй ещё!'}
            </div>
            <div className="res">
              Правильно {score} из {TOTAL}
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
