import { useEffect, useMemo, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx, speak } from '@lib/sfx';
import { stopVoice } from '@lib/voice';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './eats.css';

type Pair = {
  /** животное */
  a: string;
  /** название животного */
  an: string;
  /** кого угощаем (для вопроса «Чем угостим ...?») */
  to: string;
  /** еда */
  f: string;
  /** название еды */
  fn: string;
};

// 22 пары «животное — его еда». Еда у всех разная, поэтому её можно
// безопасно использовать как отвлекатель для других животных.
const PAIRS: Pair[] = [
  { a: '🐰', an: 'Зайчик', to: 'зайчика', f: '🥕', fn: 'Морковка' },
  { a: '🐭', an: 'Мышка', to: 'мышку', f: '🧀', fn: 'Сыр' },
  { a: '🐻', an: 'Медведь', to: 'медведя', f: '🍯', fn: 'Мёд' },
  { a: '🐼', an: 'Панда', to: 'панду', f: '🎍', fn: 'Бамбук' },
  { a: '🐨', an: 'Коала', to: 'коалу', f: '🍃', fn: 'Листья' },
  { a: '🐱', an: 'Котик', to: 'котика', f: '🐟', fn: 'Рыбка' },
  { a: '🐮', an: 'Корова', to: 'корову', f: '🌾', fn: 'Сено' },
  { a: '🐵', an: 'Обезьянка', to: 'обезьянку', f: '🍌', fn: 'Банан' },
  { a: '🐿️', an: 'Белка', to: 'белку', f: '🌰', fn: 'Орешки' },
  { a: '🐝', an: 'Пчёлка', to: 'пчёлку', f: '🌸', fn: 'Цветок' },
  { a: '🐔', an: 'Курочка', to: 'курочку', f: '🌽', fn: 'Зёрнышки' },
  { a: '🐶', an: 'Собачка', to: 'собачку', f: '🦴', fn: 'Косточка' },
  { a: '🦔', an: 'Ёжик', to: 'ёжика', f: '🍎', fn: 'Яблоко' },
  { a: '🐛', an: 'Гусеница', to: 'гусеницу', f: '🥬', fn: 'Капуста' },
  { a: '🐧', an: 'Пингвин', to: 'пингвина', f: '🦐', fn: 'Креветка' },
  { a: '🐸', an: 'Лягушка', to: 'лягушку', f: '🦟', fn: 'Комарик' },
  { a: '🐘', an: 'Слон', to: 'слона', f: '🍉', fn: 'Арбуз' },
  { a: '🐦', an: 'Птичка', to: 'птичку', f: '🪱', fn: 'Червячок' },
  { a: '🐷', an: 'Поросёнок', to: 'поросёнка', f: '🥔', fn: 'Картошка' },
  { a: '🐯', an: 'Тигр', to: 'тигра', f: '🍖', fn: 'Мясо' },
  { a: '🐹', an: 'Хомяк', to: 'хомяка', f: '🌻', fn: 'Семечки' },
  { a: '🦆', an: 'Утёнок', to: 'утёнка', f: '🍞', fn: 'Хлебные крошки' },
];

const ROUNDS = 10;

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

type Question = { animal: Pair; opts: Pair[] };

function makeQuestion(animal: Pair): Question {
  const others = shuffle(PAIRS.filter((p) => p.fn !== animal.fn));
  return { animal, opts: shuffle([animal, others[0], others[1], others[2]]) };
}

type Fly = { fn: string; dx: number; dy: number };

export default function EatsGame() {
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
  const [question, setQuestion] = useState<Question | null>(null);
  const [animalKey, setAnimalKey] = useState(0); // перезапуск pop-анимации
  const [fly, setFly] = useState<Fly | null>(null);
  const [jump, setJump] = useState(false);
  const deck = useRef<Pair[]>([]);
  const animalRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  function after(ms: number, fn: () => void) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  useEffect(() => {
    syncWallet();
    next();
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];
      stopVoice();
    };
  }, []);

  // задание проговаривается голосом на каждом новом раунде
  useEffect(() => {
    if (!question || finished) return;
    speak(`Чем угостим ${question.animal.to}?`);
  }, [question, finished]);

  function next() {
    setLocked(false);
    setPicked(null);
    setToast(null);
    setFly(null);
    setJump(false);
    if (deck.current.length === 0) deck.current = shuffle(PAIRS);
    const animal = deck.current.shift()!;
    setQuestion(makeQuestion(animal));
    setAnimalKey((k) => k + 1);
  }

  function choose(o: Pair, el: HTMLButtonElement) {
    if (locked || !question || finished) return;
    setLocked(true);
    setPicked(o.fn);
    const correct = o.fn === question.animal.fn;
    let newScore = score;
    if (correct) {
      sfx(true);
      addCoins(1);
      newScore = score + 1;
      setScore(newScore);
      setToast({ text: 'Верно! Ням-ням!', kind: 'good' });
      // еда улетает к животному, животное подпрыгивает
      const from = el.getBoundingClientRect();
      const target = animalRef.current?.getBoundingClientRect();
      if (target) {
        setFly({
          fn: o.fn,
          dx: Math.round(
            target.left + target.width / 2 - (from.left + from.width / 2),
          ),
          dy: Math.round(
            target.top + target.height / 2 - (from.top + from.height / 2),
          ),
        });
      }
      after(520, () => setJump(true));
    } else {
      sfx(false);
      setToast({ text: `Это любит не ${question.animal.to}`, kind: 'bad' });
    }
    const newRound = round + 1;
    setRound(newRound);
    after(correct ? 1000 : 1200, () => {
      if (newRound >= ROUNDS) finish(newScore);
      else next();
    });
  }

  function finish(finalScore: number) {
    setFinished(true);
    const s =
      finalScore >= 10 ? 3 : finalScore >= 7 ? 2 : finalScore >= 4 ? 1 : 0;
    for (let i = 0; i < s; i++) {
      after(200 + i * 220, () => setStarsOn(i + 1));
    }
    if (s >= 1) burstConfetti();
    saveBest('eats', finalScore);
  }

  function again() {
    deck.current = [];
    setRound(0);
    setScore(0);
    setFinished(false);
    setStarsOn(0);
    next();
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
        <span className="title">Кто что ест?</span>
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
          <div className="playing board">
            <div className="ask">
              <div className="lead">Чем угостим?</div>
            </div>

            <div className="animal-box">
              <div
                key={animalKey}
                ref={animalRef}
                className={'animal pop' + (jump ? ' jump' : '')}
                aria-hidden="true"
              >
                {question.animal.a}
              </div>
              <div className="animal-name">{question.animal.an}</div>
              <div className="hungry">хочет кушать!</div>
            </div>

            <div className={'toast' + (toast ? ' ' + toast.kind : '')}>
              {toast?.text ?? ''}
            </div>

            <div className="opts">
              {question.opts.map((o) => (
                <button
                  key={o.fn}
                  type="button"
                  aria-label={o.fn}
                  disabled={locked}
                  style={
                    fly && fly.fn === o.fn
                      ? ({
                          '--dx': `${fly.dx}px`,
                          '--dy': `${fly.dy}px`,
                        } as React.CSSProperties)
                      : undefined
                  }
                  className={
                    'opt food' +
                    (locked && o.fn === question.animal.fn ? ' correct' : '') +
                    (locked && picked === o.fn && o.fn !== question.animal.fn
                      ? ' wrong'
                      : '') +
                    (fly && fly.fn === o.fn ? ' fly' : '')
                  }
                  onClick={(e) => choose(o, e.currentTarget)}
                >
                  <span className="food-emoji" aria-hidden="true">
                    {o.f}
                  </span>
                  <span className="food-name">{o.fn}</span>
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
