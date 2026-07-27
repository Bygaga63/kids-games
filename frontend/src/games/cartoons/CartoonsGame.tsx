import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './cartoons.css';

type Hero = { img: string; n: string; line: string };

// Сборники: пока русские мультики — 17 героев
const COLLECTIONS: Record<string, { label: string; heroes: Hero[] }> = {
  ru: {
    label: 'Русские мультики',
    heroes: [
      {
        img: '/assets/cartoons/cheburashka.jpg',
        n: 'Чебурашка',
        line: 'Неизвестный науке зверёк с большими ушами, лучший друг Гены.',
      },
      {
        img: '/assets/cartoons/gena.jpg',
        n: 'Крокодил Гена',
        line: 'Работает в зоопарке крокодилом и играет на гармошке.',
      },
      {
        img: '/assets/cartoons/vinni.jpg',
        n: 'Винни-Пух',
        line: 'Медвежонок, который очень любит мёд и ходит в гости по утрам.',
      },
      {
        img: '/assets/cartoons/volk.jpg',
        n: 'Волк из «Ну, погоди!»',
        line: 'Всё время гоняется за Зайцем и кричит: «Ну, погоди!»',
      },
      {
        img: '/assets/cartoons/leopold.jpg',
        n: 'Кот Леопольд',
        line: 'Добрый кот: «Ребята, давайте жить дружно!»',
      },
      {
        img: '/assets/cartoons/karlson.jpg',
        n: 'Карлсон',
        line: 'Мужчина в самом расцвете сил с моторчиком на спине.',
      },
      {
        img: '/assets/cartoons/buratino.jpg',
        n: 'Буратино',
        line: 'Деревянный мальчик с длинным носом и золотым ключиком.',
      },
      {
        img: '/assets/cartoons/neznayka.jpg',
        n: 'Незнайка',
        line: 'Коротышка из Цветочного города в большой синей шляпе.',
      },
      {
        img: '/assets/cartoons/matroskin.jpg',
        n: 'Кот Матроскин',
        line: 'Полосатый кот из Простоквашино: «А я ещё и вышивать могу!»',
      },
      {
        img: '/assets/cartoons/kuzya.jpg',
        n: 'Домовёнок Кузя',
        line: 'Маленький домовой, который ищет свой сундучок со сказками.',
      },
      {
        img: '/assets/cartoons/yozhik.jpg',
        n: 'Ёжик в тумане',
        line: 'Он шёл к Медвежонку считать звёзды и заблудился в тумане.',
      },
      {
        img: '/assets/cartoons/umka.jpg',
        n: 'Умка',
        line: 'Белый медвежонок, который подружился с мальчиком.',
      },
      {
        img: '/assets/cartoons/bremen.jpg',
        n: 'Бременские музыканты',
        line: 'Трубадур и его друзья-звери поют: «Ничего на свете лучше нету…»',
      },
      {
        img: '/assets/cartoons/lvyonok.jpg',
        n: 'Львёнок и Черепаха',
        line: 'Они вместе пели песню: «Я на солнышке лежу…»',
      },
      {
        img: '/assets/cartoons/mashamedved.jpg',
        n: 'Маша и Медведь',
        line: 'Озорная девочка и её большой добрый друг.',
      },
      {
        img: '/assets/cartoons/smeshariki.jpg',
        n: 'Смешарики',
        line: 'Круглые весёлые герои: Крош, Ёжик, Нюша и другие.',
      },
      {
        img: '/assets/cartoons/fiksiki.jpg',
        n: 'Фиксики',
        line: 'Маленькие человечки, которые чинят технику: «Тыдыщ!»',
      },
    ],
  },
};

const DATA = COLLECTIONS.ru.heroes;
const ROUNDS = 10;
const CONFETTI_COLORS = [
  '#1c7ed6',
  '#74c0fc',
  '#12b886',
  '#ffd43b',
  '#ff5a7a',
  '#ff922b',
];

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

export default function CartoonsGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [current, setCurrent] = useState<Hero | null>(null);
  const [opts, setOpts] = useState<Hero[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    head: string;
    body: string;
    kind: 'good' | 'bad';
  } | null>(null);
  const [showNext, setShowNext] = useState(false);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const [photoKey, setPhotoKey] = useState(0); // перезапуск pop-анимации
  const queue = useRef<Hero[]>([]);

  useEffect(() => {
    syncWallet();
    next(0);
  }, []);

  function next(r: number) {
    setLocked(false);
    setShowNext(false);
    setToast(null);
    setPicked(null);
    if (queue.current.length === 0) queue.current = shuffle(DATA);
    const cur = queue.current.shift()!;
    setCurrent(cur);
    const others = shuffle(DATA.filter((d) => d.n !== cur.n));
    setOpts(shuffle([cur, others[0], others[1], others[2]]));
    setPhotoKey((k) => k + 1);
    setBarWidth((r / ROUNDS) * 100);
  }

  function choose(o: Hero) {
    if (locked || !current) return;
    setLocked(true);
    setPicked(o.n);
    const correct = o.n === current.n;
    if (correct) {
      sfx(true);
      addCoins(1);
      setScore(score + 1);
      setToast({
        head: 'Верно, это ' + current.n + '!',
        body: current.line,
        kind: 'good',
      });
    } else {
      sfx(false);
      setToast({
        head: 'Это ' + current.n + '.',
        body: current.line,
        kind: 'bad',
      });
    }
    setRound(round + 1);
    // подпись читаем спокойно — дальше по кнопке
    setShowNext(true);
  }

  function finish() {
    setBarWidth(100);
    setFinished(true);
    const stars = score >= 10 ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;
    for (let i = 0; i < stars; i++) {
      setTimeout(() => setStarsOn(i + 1), 200 + i * 220);
    }
    if (stars >= 1) burstConfetti(CONFETTI_COLORS);
    saveBest('cartoons', score);
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
        <span className="title">Кто из мультика?</span>
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
            Русские мультики
          </button>
          <button className="pill" type="button" disabled>
            Мультики мира — скоро
          </button>
        </div>

        {!finished && (
          <div className="progress playing">
            <i style={{ width: `${barWidth}%` }} />
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
              Посмотри на картинку: из какого это мультика?
            </div>
            <img
              key={photoKey}
              className="photo pop"
              src={current.img}
              alt="Картинка с героем мультфильма"
            />
            <div className="opts">
              {opts.map((o) => (
                <button
                  key={o.n}
                  className={
                    'opt' +
                    (locked && o.n === current.n ? ' correct' : '') +
                    (locked && picked === o.n && o.n !== current.n
                      ? ' wrong'
                      : '')
                  }
                  type="button"
                  disabled={locked}
                  onClick={() => choose(o)}
                >
                  {o.n}
                </button>
              ))}
            </div>
            <div className={'toast' + (toast ? ' ' + toast.kind : '')}>
              {toast && (
                <>
                  <b>{toast.head}</b> {toast.body}
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
                  {round >= ROUNDS ? 'Смотреть результат' : 'Следующий герой'}
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
                  stroke="none"
                >
                  {STAR}
                </svg>
              ))}
            </div>
            <div className="big">
              {stars === 3
                ? 'Знаток мультиков!'
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
