import { Fragment, useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './what-next.css';

type Story = { seq: string[]; ans: string; distr: string[]; expl: string };

// истории: 3 кадра → правильный 4-й + обманки
const DATA: Story[] = [
  {
    seq: ['🫘', '🌱', '🪴'],
    ans: '🌷',
    distr: ['🍂', '🪨', '🍄'],
    expl: 'Семечко проросло — и выросло в цветок!',
  },
  {
    seq: ['🥚', '🐣', '🐤'],
    ans: '🐔',
    distr: ['🍳', '🐢', '🐟'],
    expl: 'Из яйца вылупился цыплёнок и вырос в курицу!',
  },
  {
    seq: ['🌑', '🌒', '🌓'],
    ans: '🌔',
    distr: ['☀️', '⭐', '🌍'],
    expl: 'Луна растёт на небе с каждой ночью.',
  },
  {
    seq: ['🌅', '☀️', '🌇'],
    ans: '🌙',
    distr: ['🌈', '⚡', '⛄'],
    expl: 'После заката наступает ночь.',
  },
  {
    seq: ['❄️', '☃️', '☀️'],
    ans: '💧',
    distr: ['🧊', '☔', '⛄'],
    expl: 'Пригрело солнышко — и снеговик растаял.',
  },
  {
    seq: ['🌾', '🥣', '🥖'],
    ans: '🥪',
    distr: ['🍰', '🍕', '🌽'],
    expl: 'Из зёрен — мука, из муки — хлеб, из хлеба — бутерброд!',
  },
  {
    seq: ['👶', '🧒', '🧑'],
    ans: '👴',
    distr: ['👶', '🤖', '🐵'],
    expl: 'Люди растут и становятся старше.',
  },
  {
    seq: ['☁️', '🌧️', '🌦️'],
    ans: '🌈',
    distr: ['⚡', '🌪️', '❄️'],
    expl: 'После дождика и солнышка приходит радуга!',
  },
  {
    seq: ['🌸', '🍏', '🍎'],
    ans: '🥧',
    distr: ['🍋', '🍅', '🌰'],
    expl: 'Яблоко поспело — испекли яблочный пирог!',
  },
  {
    seq: ['🥱', '🛌', '😴'],
    ans: '🌅',
    distr: ['🌙', '🎮', '🍕'],
    expl: 'Выспался — и наступило доброе утро!',
  },
];

const ROUNDS = 8;
const CONFETTI_COLORS = [
  '#5c940d',
  '#a9e34b',
  '#12b886',
  '#ffd43b',
  '#ff5a7a',
  '#3b6cf6',
];

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

type Question = { story: Story; opts: string[] };
type Toast = { b: string; rest: string; kind: 'good' | 'bad' };

export default function WhatNextGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [wrong, setWrong] = useState<{ idx: number; k: number } | null>(null);
  const [filled, setFilled] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showNext, setShowNext] = useState(false);
  const [barRound, setBarRound] = useState(0);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [finalStars, setFinalStars] = useState(0);
  const mistakes = useRef(0);
  const queue = useRef<Story[]>([]);

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
    setFilled(false);
    if (queue.current.length === 0) queue.current = shuffle(DATA);
    const story = queue.current.shift()!;
    const opts = shuffle([story.ans].concat(story.distr));
    setQuestion({ story, opts });
    setBarRound(curRound);
  }

  function choose(idx: number) {
    if (locked || !question) return;
    const e = question.opts[idx];
    if (e !== question.story.ans) {
      mistakes.current++;
      setWrong((w) => ({ idx, k: (w?.k ?? 0) + 1 }));
      sfx(false);
      setToast({
        b: 'Подумай ещё!',
        rest: 'Посмотри, что происходит на картинках.',
        kind: 'bad',
      });
      return;
    }
    setLocked(true);
    setPickedIdx(idx);
    sfx(true);
    addCoins(1);
    setFilled(true);
    if (mistakes.current === 0) setScore((s) => s + 1);
    setToast({ b: 'Верно!', rest: question.story.expl, kind: 'good' });
    setRound(round + 1);
    // объяснение читаем спокойно — дальше по кнопке
    setShowNext(true);
  }

  function finish() {
    setBarRound(ROUNDS);
    setFinished(true);
    const stars =
      score >= ROUNDS
        ? 3
        : score >= Math.ceil(ROUNDS * 0.7)
          ? 2
          : score >= Math.ceil(ROUNDS * 0.4)
            ? 1
            : 0;
    setFinalStars(stars);
    for (let i = 0; i < stars; i++) {
      setTimeout(() => setStarsOn(i + 1), 200 + i * 220);
    }
    if (stars >= 1) burstConfetti(CONFETTI_COLORS);
    saveBest('whatnext', score);
  }

  function again() {
    setRound(0);
    setScore(0);
    queue.current = [];
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
        <span className="title">Что дальше?</span>
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
              width: '100%',
            }}
          >
            <div className="lead">Посмотри на историю: что будет дальше?</div>
            <div className="strip">
              {question.story.seq.map((e, i) => (
                <Fragment key={i}>
                  <div className="frame">{e}</div>
                  <span className="arrow">→</span>
                </Fragment>
              ))}
              <div className={'frame q' + (filled ? ' filled' : '')}>
                {filled ? question.story.ans : '?'}
              </div>
            </div>
            <div className="opts">
              {question.opts.map((e, idx) => (
                <button
                  key={`${idx}:${wrong && wrong.idx === idx ? wrong.k : 0}`}
                  type="button"
                  className={
                    'opt' +
                    (locked && idx === pickedIdx ? ' correct' : '') +
                    (wrong && wrong.idx === idx ? ' wrong' : '')
                  }
                  disabled={locked}
                  aria-label="Вариант ответа"
                  onClick={() => choose(idx)}
                >
                  {e}
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
                <span>
                  {round >= ROUNDS ? 'Смотреть результат' : 'Следующая история'}
                </span>
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
                ? 'Мастер историй!'
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
