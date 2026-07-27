import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { say, stopVoice } from '@lib/voice';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './tales.css';

type Hero = { e: string; n: string; tale: string; riddle: string };

// Сборники: пока русские сказки — 16 героев с загадками от первого лица
const COLLECTIONS: Record<string, { label: string; heroes: Hero[] }> = {
  ru: {
    label: 'Русские сказки',
    heroes: [
      {
        e: '🥮',
        n: 'Колобок',
        tale: '«Колобок»',
        riddle: 'Я круглый и румяный: от бабушки ушёл и от дедушки ушёл!',
      },
      {
        e: '🧹',
        n: 'Баба-Яга',
        tale: 'русские сказки',
        riddle:
          'Живу в избушке на курьих ножках, летаю в ступе и мету след метлой.',
      },
      {
        e: '💀',
        n: 'Кощей Бессмертный',
        tale: '«Царевна-лягушка»',
        riddle:
          'Я худой и очень злой, а смерть моя — на конце иглы, игла — в яйце.',
      },
      {
        e: '🐉',
        n: 'Змей Горыныч',
        tale: 'былины и сказки',
        riddle: 'У меня целых три головы, и каждая умеет дышать огнём!',
      },
      {
        e: '🤴',
        n: 'Иван-царевич',
        tale: '«Иван-царевич и Серый волк»',
        riddle:
          'Я младший сын царя: ловлю Жар-птицу и выручаю царевну из беды.',
      },
      {
        e: '🐸',
        n: 'Царевна-лягушка',
        tale: '«Царевна-лягушка»',
        riddle:
          'Днём я зелёная и сижу на болоте, а ночью сбрасываю кожу и становлюсь красавицей.',
      },
      {
        e: '🐟',
        n: 'Емеля',
        tale: '«По щучьему велению»',
        riddle:
          'Я лежу на печи, а вёдра сами домой идут — стоит сказать: «По щучьему велению!»',
      },
      {
        e: '❄️',
        n: 'Снегурочка',
        tale: '«Снегурочка»',
        riddle: 'Я внучка из снега: боюсь солнышка и тёплого костра.',
      },
      {
        e: '🥶',
        n: 'Морозко',
        tale: '«Морозко»',
        riddle:
          'Я зимний волшебник, спрашиваю в лесу: «Тепло ли тебе, девица?»',
      },
      {
        e: '🔥',
        n: 'Жар-птица',
        tale: '«Иван-царевич и Серый волк»',
        riddle:
          'Моё перо светится, как огонь, — за мной охотятся царские сыновья.',
      },
      {
        e: '🐺',
        n: 'Серый волк',
        tale: '«Иван-царевич и Серый волк»',
        riddle: 'Я мчу Ивана-царевича на своей спине быстрее ветра.',
      },
      {
        e: '🐔',
        n: 'Курочка Ряба',
        tale: '«Курочка Ряба»',
        riddle: 'Я снесла яичко — не простое, а золотое!',
      },
      {
        e: '🐠',
        n: 'Золотая рыбка',
        tale: '«Сказка о рыбаке и рыбке»',
        riddle: 'Я живу в синем море и исполняю желания старика-рыбака.',
      },
      {
        e: '👧',
        n: 'Маша',
        tale: '«Маша и медведь»',
        riddle:
          'Я спряталась в короб с пирожками и приговаривала: «Высоко сижу, далеко гляжу!»',
      },
      {
        e: '⚔️',
        n: 'Илья Муромец',
        tale: 'былины',
        riddle:
          'Тридцать лет я сидел на печи, а потом стал самым сильным богатырём.',
      },
      {
        e: '🦢',
        n: 'Гуси-лебеди',
        tale: '«Гуси-лебеди»',
        riddle:
          'Мы служим Бабе-Яге: подхватили братца на крылья и унесли за тёмный лес.',
      },
    ],
  },
};
const DATA = COLLECTIONS.ru.heroes;
const ROUNDS = 10;
const CONFETTI_COLORS = [
  '#a61e4d',
  '#f06595',
  '#12b886',
  '#ffd43b',
  '#3b6cf6',
  '#ff922b',
];

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

type Toast = { b: string; rest: string; kind: 'good' | 'bad' };

export default function TalesGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [barPct, setBarPct] = useState(0);
  const [locked, setLocked] = useState(false);
  const [current, setCurrent] = useState<Hero | null>(null);
  const [opts, setOpts] = useState<Hero[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showNext, setShowNext] = useState(false);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [riddleKey, setRiddleKey] = useState(0); // перезапуск pop-анимации

  const queue = useRef<Hero[]>([]);

  useEffect(() => {
    syncWallet();
    next(0);
    return () => {
      stopVoice();
    };
  }, []);

  function next(r: number) {
    setLocked(false);
    setPicked(null);
    setShowNext(false);
    setToast(null);
    if (queue.current.length === 0) queue.current = shuffle(DATA);
    const cur = queue.current.shift()!;
    setCurrent(cur);
    const others = shuffle(DATA.filter((d) => d.n !== cur.n));
    setOpts(shuffle([cur, others[0], others[1], others[2]]));
    setRiddleKey((k) => k + 1);
    setBarPct((r / ROUNDS) * 100);
  }

  function choose(o: Hero) {
    if (locked || !current) return;
    setLocked(true);
    stopVoice();
    const correct = o.n === current.n;
    setPicked(o.n);
    if (correct) {
      sfx(true);
      addCoins(1);
      setScore((s) => s + 1);
      setToast({
        b: 'Верно, это ' + current.n + '!',
        rest: ' Сказка — ' + current.tale + '.',
        kind: 'good',
      });
    } else {
      sfx(false);
      setToast({
        b: 'Это ' + current.n + '.',
        rest: ' Сказка — ' + current.tale + '.',
        kind: 'bad',
      });
    }
    setRound((r) => r + 1);
    // ответ читаем спокойно — дальше по кнопке
    setShowNext(true);
  }

  function onNext() {
    if (round >= ROUNDS) finish();
    else next(round);
  }

  function finish() {
    setFinished(true);
    const stars = score >= 10 ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;
    for (let i = 0; i < stars; i++) {
      setTimeout(() => setStarsOn(i + 1), 200 + i * 220);
    }
    if (stars >= 1) burstConfetti(CONFETTI_COLORS, 70);
    saveBest('tales', score);
  }

  function again() {
    setRound(0);
    setScore(0);
    queue.current = [];
    setFinished(false);
    setStarsOn(0);
    next(0);
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
        <span className="title">Угадай героя</span>
        <span className="spacer" />
        <span className="score">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
            {STAR}
          </svg>
          <span>{score}</span>
        </span>
      </header>

      <main className="stage">
        <div className="countries">
          <button className="pill on" type="button">
            Русские сказки
          </button>
          <button className="pill" type="button" disabled>
            Сказки мира — скоро
          </button>
        </div>

        {!finished && (
          <div className="progress playing">
            <i style={{ width: `${barPct}%` }} />
          </div>
        )}

        {!finished && current && (
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
              Герой сказки загадал про себя загадку. Кто это?
            </div>
            <div
              key={riddleKey}
              className={'riddle pop' + (locked ? ' done' : '')}
            >
              <span className="mark" aria-hidden="true">
                ?
              </span>
              <span className="reveal" aria-hidden="true">
                {current.e}
              </span>
              <p className="txt">{current.riddle}</p>
              <button
                className="say"
                type="button"
                onClick={() => say(current.riddle)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 10v4h4l5 4V6L8 10H4z" />
                  <path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11" />
                </svg>
                Прочитай мне
              </button>
            </div>
            <div className="opts">
              {opts.map((o) => (
                <button
                  key={o.n}
                  type="button"
                  disabled={locked}
                  className={
                    'opt' +
                    (locked && o.n === current.n ? ' correct' : '') +
                    (locked && picked === o.n && o.n !== current.n
                      ? ' wrong'
                      : '')
                  }
                  onClick={() => choose(o)}
                >
                  {o.n}
                </button>
              ))}
            </div>
            <div className={'toast' + (toast ? ' ' + toast.kind : '')}>
              {toast && (
                <>
                  <b>{toast.b}</b>
                  {toast.rest}
                </>
              )}
            </div>
            {showNext && (
              <button className="btn next" type="button" onClick={onNext}>
                <span>
                  {round >= ROUNDS ? 'Смотреть результат' : 'Следующая загадка'}
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
                >
                  {STAR}
                </svg>
              ))}
            </div>
            <div className="big">
              {stars === 3
                ? 'Знаток сказок!'
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
