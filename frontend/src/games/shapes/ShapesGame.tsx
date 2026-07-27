import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './shapes.css';

type Shape = { n: string; svg: string; fact: string };

// 12 фигур: SVG-контур (viewBox 0 0 100 100) + запоминалка
const DATA: Shape[] = [
  {
    n: 'Круг',
    svg: '<circle cx="50" cy="50" r="38"/>',
    fact: 'Круг ровный со всех сторон — как солнышко или мячик.',
  },
  {
    n: 'Квадрат',
    svg: '<rect x="14" y="14" width="72" height="72" rx="6"/>',
    fact: 'У квадрата 4 стороны, и все они одинаковые!',
  },
  {
    n: 'Треугольник',
    svg: '<path d="M50 12 88 84H12z"/>',
    fact: 'У треугольника 3 угла и 3 стороны — как у крыши домика.',
  },
  {
    n: 'Прямоугольник',
    svg: '<rect x="8" y="26" width="84" height="48" rx="6"/>',
    fact: 'У прямоугольника стороны напротив равны — как у двери или книги.',
  },
  {
    n: 'Овал',
    svg: '<ellipse cx="50" cy="50" rx="42" ry="28"/>',
    fact: 'Овал — это вытянутый круг, как яичко.',
  },
  {
    n: 'Ромб',
    svg: '<path d="M50 8 88 50 50 92 12 50z"/>',
    fact: 'Ромб — как квадратик, который встал на уголок.',
  },
  {
    n: 'Трапеция',
    svg: '<path d="M30 26h40l18 48H12z"/>',
    fact: 'У трапеции верх короче низа — как у лодочки.',
  },
  {
    n: 'Звезда',
    svg: '<path d="M50 8l11.8 24 26.4 3.8-19.1 18.6 4.5 26.3L50 68.3 26.4 80.7l4.5-26.3L11.8 35.8 38.2 32z"/>',
    fact: 'У звезды пять лучиков — как у звёздочки на небе!',
  },
  {
    n: 'Сердце',
    svg: '<path d="M50 86C28 70 12 56 12 38c0-12 9-20 20-20 8 0 14 4 18 10 4-6 10-10 18-10 11 0 20 8 20 20 0 18-16 32-38 48z"/>',
    fact: 'Сердечко рисуют, когда кого-то очень любят.',
  },
  {
    n: 'Полумесяц',
    svg: '<path d="M62 8a42 42 0 1 0 0 84 34 34 0 1 1 0-84z"/>',
    fact: 'Полумесяц — как луна на ночном небе.',
  },
  {
    n: 'Пятиугольник',
    svg: '<path d="M50 8 90 38 74 88H26L10 38z"/>',
    fact: 'У пятиугольника 5 углов — попробуй посчитать!',
  },
  {
    n: 'Шестиугольник',
    svg: '<path d="M30 12h40l20 38-20 38H30L10 50z"/>',
    fact: 'У шестиугольника 6 углов — как у сот пчёлки.',
  },
];
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

const ROUNDS = 10;

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

type Question = { current: Shape; color: string; opts: Shape[] };
type Toast = { b: string; rest: string; kind: 'good' | 'bad' };

export default function ShapesGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showNext, setShowNext] = useState(false);
  const [barRound, setBarRound] = useState(0);
  const [figKey, setFigKey] = useState(0); // перезапуск pop-анимации
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [finalStars, setFinalStars] = useState(0);
  const queue = useRef<Shape[]>([]);

  useEffect(() => {
    syncWallet();
    next(0);
  }, []);

  function next(curRound: number) {
    setLocked(false);
    setShowNext(false);
    setToast(null);
    setPickedIdx(null);
    if (queue.current.length === 0) queue.current = shuffle(DATA);
    const current = queue.current.shift()!;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const others = shuffle(DATA.filter((d) => d.n !== current.n));
    const opts = shuffle([current, others[0], others[1], others[2]]);
    setQuestion({ current, color, opts });
    setFigKey((k) => k + 1);
    setBarRound(curRound);
  }

  function choose(idx: number) {
    if (locked || !question) return;
    setLocked(true);
    setPickedIdx(idx);
    const o = question.opts[idx];
    const correct = o.n === question.current.n;
    if (correct) {
      sfx(true);
      addCoins(1);
      setScore((s) => s + 1);
      setToast({
        b: 'Верно, это ' + question.current.n.toLowerCase() + '!',
        rest: question.current.fact,
        kind: 'good',
      });
    } else {
      sfx(false);
      setToast({
        b: 'Это ' + question.current.n.toLowerCase() + '.',
        rest: question.current.fact,
        kind: 'bad',
      });
    }
    setRound(round + 1);
    // запоминалку читаем спокойно — дальше по кнопке
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
    if (stars >= 1) burstConfetti(COLORS);
    saveBest('shapes', score);
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
        <span className="title">Учим фигуры</span>
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
              gap: 'clamp(14px,3.5vw,22px)',
            }}
          >
            <div className="lead">Какая это фигура?</div>
            <div key={figKey} className="fig pop">
              <svg
                viewBox="0 0 100 100"
                fill={question.color}
                aria-label="Фигура-загадка"
                dangerouslySetInnerHTML={{ __html: question.current.svg }}
              />
            </div>
            <div className="opts">
              {question.opts.map((o, idx) => (
                <button
                  key={o.n}
                  type="button"
                  disabled={locked}
                  className={
                    'opt' +
                    (locked && o.n === question.current.n ? ' correct' : '') +
                    (locked && idx === pickedIdx && o.n !== question.current.n
                      ? ' wrong'
                      : '')
                  }
                  onClick={() => choose(idx)}
                >
                  {o.n}
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
                  {round >= ROUNDS ? 'Смотреть результат' : 'Следующая фигура'}
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
                ? 'Знаток фигур!'
                : finalStars >= 1
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
