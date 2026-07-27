import { useEffect, useMemo, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './colors.css';

type Color = { n: string; c: string };

const COLORS: Color[] = [
  { n: 'Красный', c: '#ff5252' },
  { n: 'Синий', c: '#3b6cf6' },
  { n: 'Жёлтый', c: '#ffd43b' },
  { n: 'Зелёный', c: '#40c057' },
  { n: 'Оранжевый', c: '#ff922b' },
  { n: 'Фиолетовый', c: '#9775fa' },
  { n: 'Розовый', c: '#f783ac' },
  { n: 'Голубой', c: '#74c0fc' },
  { n: 'Коричневый', c: '#a1683a' },
  { n: 'Серый', c: '#adb5bd' },
];

const ROUNDS = 10;

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

type Question = { target: Color; opts: Color[] };

function makeDeck(): Color[] {
  // колода без повторов: каждый цвет-цель встречается один раз за игру
  return shuffle(COLORS);
}

function makeQuestion(target: Color): Question {
  const others = shuffle(COLORS.filter((c) => c.n !== target.n));
  return { target, opts: shuffle([target, others[0], others[1], others[2]]) };
}

export default function ColorsGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    text: string;
    kind: 'good' | 'bad';
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [swatchKey, setSwatchKey] = useState(0); // перезапуск pop-анимации
  const deck = useRef<Color[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);

  useEffect(() => {
    syncWallet();
    next(0);
  }, []);

  function next(_round: number) {
    setLocked(false);
    setPicked(null);
    setToast(null);
    if (deck.current.length === 0) deck.current = makeDeck();
    const target = deck.current.shift()!;
    setQuestion(makeQuestion(target));
    setSwatchKey((k) => k + 1);
  }

  function choose(o: Color) {
    if (locked || !question || finished) return;
    setLocked(true);
    setPicked(o.n);
    const correct = o.n === question.target.n;
    let newScore = score;
    if (correct) {
      sfx(true);
      addCoins(1);
      newScore = score + 1;
      setScore(newScore);
      setToast({ text: 'Верно!', kind: 'good' });
    } else {
      sfx(false);
      setToast({ text: 'Это ' + question.target.n.toLowerCase(), kind: 'bad' });
    }
    const newRound = round + 1;
    setRound(newRound);
    setTimeout(
      () => {
        if (newRound >= ROUNDS) finish(newScore);
        else next(newRound);
      },
      correct ? 700 : 1150,
    );
  }

  function finish(finalScore: number) {
    setFinished(true);
    const stars =
      finalScore >= 10 ? 3 : finalScore >= 7 ? 2 : finalScore >= 4 ? 1 : 0;
    for (let i = 0; i < stars; i++) {
      setTimeout(() => setStarsOn(i + 1), 200 + i * 220);
    }
    if (stars >= 1) burstConfetti();
    saveBest('colors', finalScore);
  }

  function again() {
    deck.current = [];
    setRound(0);
    setScore(0);
    setFinished(false);
    setStarsOn(0);
    next(0);
  }

  const stars = useMemo(
    () => (score >= 10 ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0),
    [score],
  );

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
        <span className="title">Угадай цвет</span>
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

        {!finished && question && (
          <div
            className="playing"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(18px,4vw,30px)',
            }}
          >
            <div className="ask">
              <div className="lead">Какой это цвет?</div>
            </div>
            <div
              key={swatchKey}
              className="swatch pop"
              style={{ background: question.target.c }}
            />
            <div className={'toast' + (toast ? ' ' + toast.kind : '')}>
              {toast?.text ?? ''}
            </div>
            <div className="opts">
              {question.opts.map((o) => (
                <button
                  key={o.n}
                  type="button"
                  disabled={locked}
                  className={
                    'opt' +
                    (locked && o.n === question.target.n ? ' correct' : '') +
                    (locked && picked === o.n && o.n !== question.target.n
                      ? ' wrong'
                      : '')
                  }
                  onClick={() => choose(o)}
                >
                  {o.n}
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
