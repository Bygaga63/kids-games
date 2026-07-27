import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './sequence.css';

type ShapeKey = 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'rhombus';

const SHAPES: Record<ShapeKey, string> = {
  circle: '<circle cx="50" cy="50" r="38"/>',
  square: '<rect x="14" y="14" width="72" height="72" rx="8"/>',
  triangle: '<path d="M50 12 88 84H12z"/>',
  star: '<path d="M50 8l11.8 24 26.4 3.8-19.1 18.6 4.5 26.3L50 68.3 26.4 80.7l4.5-26.3L11.8 35.8 38.2 32z"/>',
  heart:
    '<path d="M50 86C28 70 12 56 12 38c0-12 9-20 20-20 8 0 14 4 18 10 4-6 10-10 18-10 11 0 20 8 20 20 0 18-16 32-38 48z"/>',
  rhombus: '<path d="M50 8 88 50 50 92 12 50z"/>',
};
const KEYS = Object.keys(SHAPES) as ShapeKey[];
const COLORS = [
  '#fa5252',
  '#339af0',
  '#ffd43b',
  '#51cf66',
  '#845ef7',
  '#ff922b',
  '#f06595',
  '#22b8cf',
];

type Level = 'easy' | 'mid' | 'hard';

// ритмы: буквы — разные фигуры
const LEVELS: Record<Level, { patterns: string[][]; show: number }> = {
  easy: {
    patterns: [
      ['A', 'B'],
      ['A', 'A', 'B'],
    ],
    show: 7,
  },
  mid: {
    patterns: [
      ['A', 'B', 'C'],
      ['A', 'B', 'B'],
      ['A', 'A', 'B'],
    ],
    show: 8,
  },
  hard: {
    patterns: [
      ['A', 'B', 'C', 'D'],
      ['A', 'A', 'B', 'B'],
      ['A', 'B', 'A', 'C'],
    ],
    show: 8,
  },
};

const ROUNDS = 10;

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

type Piece = { shape: ShapeKey; color: string };
type Question = { shown: Piece[]; answer: Piece; opts: Piece[] };
type Toast = { text: string; kind: 'good' | 'bad' };

function PieceSvg({ piece }: { piece: Piece }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill={piece.color}
      dangerouslySetInnerHTML={{ __html: SHAPES[piece.shape] }}
    />
  );
}

export default function SequenceGame() {
  const [level, setLevel] = useState<Level>('easy');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [wrong, setWrong] = useState<{ idx: number; k: number } | null>(null);
  const [filled, setFilled] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [barRound, setBarRound] = useState(0);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [finalStars, setFinalStars] = useState(0);
  const mistakes = useRef(0);
  const levelRef = useRef<Level>('easy');

  useEffect(() => {
    syncWallet();
    next(0, 'easy');
  }, []);

  function next(curRound: number, lvl: Level) {
    setLocked(false);
    mistakes.current = 0;
    setToast(null);
    setPickedIdx(null);
    setWrong(null);
    setFilled(false);

    const cfg = LEVELS[lvl];
    const pattern =
      cfg.patterns[Math.floor(Math.random() * cfg.patterns.length)];
    const letters: string[] = [];
    pattern.forEach((L) => {
      if (letters.indexOf(L) < 0) letters.push(L);
    });

    // буквам — разные фигуры с разными цветами
    const shapes = shuffle(KEYS);
    const colors = shuffle(COLORS);
    const map: Record<string, Piece> = {};
    letters.forEach((L, i) => {
      map[L] = { shape: shapes[i], color: colors[i] };
    });

    const seq: Piece[] = [];
    while (seq.length <= cfg.show) {
      pattern.forEach((L) => {
        seq.push(map[L]);
      });
    }
    const shown = seq.slice(0, cfg.show);
    const answer = seq[cfg.show];

    // варианты: фигуры ряда + одна лишняя
    let opts = letters.map((L) => map[L]);
    opts.push({ shape: shapes[letters.length], color: colors[letters.length] });
    opts = shuffle(opts);

    setQuestion({ shown, answer, opts });
    setBarRound(curRound);
  }

  function choose(idx: number) {
    if (locked || !question) return;
    const it = question.opts[idx];
    if (it.shape !== question.answer.shape) {
      mistakes.current++;
      setWrong((w) => ({ idx, k: (w?.k ?? 0) + 1 }));
      sfx(false);
      setToast({
        text: 'Подумай ещё: посмотри, как повторяется ряд',
        kind: 'bad',
      });
      return;
    }
    setLocked(true);
    setPickedIdx(idx);
    sfx(true);
    addCoins(1);
    setFilled(true);
    let newScore = score;
    if (mistakes.current === 0) {
      newScore = score + 1;
      setScore(newScore);
    }
    setToast({ text: 'Верно! Ряд продолжается!', kind: 'good' });
    const newRound = round + 1;
    setRound(newRound);
    setTimeout(() => {
      if (newRound >= ROUNDS) finish(newScore);
      else next(newRound, levelRef.current);
    }, 1100);
  }

  function finish(finalScore: number) {
    setBarRound(ROUNDS);
    setFinished(true);
    const stars =
      finalScore >= 10 ? 3 : finalScore >= 7 ? 2 : finalScore >= 4 ? 1 : 0;
    setFinalStars(stars);
    for (let i = 0; i < stars; i++) {
      setTimeout(() => setStarsOn(i + 1), 200 + i * 220);
    }
    if (stars >= 1) burstConfetti(COLORS);
    saveBest('sequence', finalScore);
  }

  function selectLevel(l: Level) {
    setLevel(l);
    levelRef.current = l;
    next(round, l);
  }

  function again() {
    setRound(0);
    setScore(0);
    setFinished(false);
    setStarsOn(0);
    setFinalStars(0);
    next(0, levelRef.current);
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
        <span className="title">Продолжи ряд</span>
        <span className="spacer" />
        <span className="score">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
            {STAR}
          </svg>
          <span>{score}</span>
        </span>
      </header>

      <main className="stage">
        <div className="seg" role="group" aria-label="Сложность">
          {(
            [
              ['easy', 'Легко'],
              ['mid', 'Средне'],
              ['hard', 'Сложно'],
            ] as [Level, string][]
          ).map(([l, label]) => (
            <button
              key={l}
              type="button"
              aria-pressed={level === l}
              onClick={() => selectLevel(l)}
            >
              {label}
            </button>
          ))}
        </div>

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
              width: '100%',
            }}
          >
            <div className="lead">
              Посмотри на ряд: какая фигура идёт дальше?
            </div>
            <div className="row">
              {question.shown.map((it, i) => (
                <div key={i} className="tile">
                  <PieceSvg piece={it} />
                </div>
              ))}
              <div className={'tile q' + (filled ? ' filled' : '')}>
                {filled ? <PieceSvg piece={question.answer} /> : '?'}
              </div>
            </div>
            <div className="opts">
              {question.opts.map((it, idx) => (
                <button
                  key={`${idx}:${wrong && wrong.idx === idx ? wrong.k : 0}`}
                  type="button"
                  className={
                    'opt' +
                    (locked && idx === pickedIdx ? ' correct' : '') +
                    (wrong && wrong.idx === idx ? ' wrong' : '')
                  }
                  disabled={locked}
                  aria-label="Фигура"
                  onClick={() => choose(idx)}
                >
                  <PieceSvg piece={it} />
                </button>
              ))}
            </div>
            <div className={'toast' + (toast ? ' ' + toast.kind : '')}>
              {toast?.text ?? ''}
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
              {finalStars === 3
                ? 'Мастер ритмов!'
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
