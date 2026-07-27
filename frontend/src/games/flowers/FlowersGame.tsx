import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './flowers.css';

type Flower = { img: string; n: string; fact: string };

// База по странам: пока Россия — 17 цветов лугов, лесов и садов
const COUNTRIES: Record<string, { label: string; flowers: Flower[] }> = {
  ru: {
    label: 'Россия',
    flowers: [
      {
        img: '/assets/flowers/romashka.jpg',
        n: 'Ромашка',
        fact: 'На ромашке гадают: «любит — не любит».',
      },
      {
        img: '/assets/flowers/oduvanchik.jpg',
        n: 'Одуванчик',
        fact: 'Одуванчик сначала жёлтый, а потом белый — и разлетается от ветра!',
      },
      {
        img: '/assets/flowers/podsnezhnik.jpg',
        n: 'Подснежник',
        fact: 'Подснежник появляется самым первым — прямо из-под снега.',
      },
      {
        img: '/assets/flowers/kolokolchik.jpg',
        n: 'Колокольчик',
        fact: 'Колокольчик похож на маленький звонкий колокол.',
      },
      {
        img: '/assets/flowers/vasilek.jpg',
        n: 'Василёк',
        fact: 'Василёк — ярко-синий цветок хлебных полей.',
      },
      {
        img: '/assets/flowers/landysh.jpg',
        n: 'Ландыш',
        fact: 'Ландыш чудесно пахнет, но его ягодки есть нельзя!',
      },
      {
        img: '/assets/flowers/matmacheha.jpg',
        n: 'Мать-и-мачеха',
        fact: 'Мать-и-мачеха зацветает ранней весной, ещё до листьев.',
      },
      {
        img: '/assets/flowers/nezabudka.jpg',
        n: 'Незабудка',
        fact: 'Незабудка — крошечный голубой цветок с жёлтым сердечком.',
      },
      {
        img: '/assets/flowers/klever.jpg',
        n: 'Клевер',
        fact: 'Клевер обожают шмели, а листик с 4 лепестками приносит удачу!',
      },
      {
        img: '/assets/flowers/ivanchay.jpg',
        n: 'Иван-чай',
        fact: 'Из иван-чая заваривают вкусный душистый чай.',
      },
      {
        img: '/assets/flowers/pion.jpg',
        n: 'Пион',
        fact: 'Пион — пышный, как розовое облако, и очень душистый.',
      },
      {
        img: '/assets/flowers/roza.jpg',
        n: 'Роза',
        fact: 'Роза — королева цветов, но у неё есть колючие шипы!',
      },
      {
        img: '/assets/flowers/tyulpan.jpg',
        n: 'Тюльпан',
        fact: 'Тюльпан раскрывается утром и закрывается на ночь.',
      },
      {
        img: '/assets/flowers/podsolnuh.jpg',
        n: 'Подсолнух',
        fact: 'Подсолнух весь день поворачивается за солнцем.',
      },
      {
        img: '/assets/flowers/siren.jpg',
        n: 'Сирень',
        fact: 'Сирень цветёт в мае. Найдёшь цветочек с 5 лепестками — на счастье!',
      },
      {
        img: '/assets/flowers/anyutiny.jpg',
        n: 'Анютины глазки',
        fact: 'Анютины глазки — трёхцветные, как весёлые мордашки.',
      },
      {
        img: '/assets/flowers/kuvshinka.jpg',
        n: 'Кувшинка',
        fact: 'Кувшинка живёт прямо на воде, как в сказке про Дюймовочку.',
      },
    ],
  },
};

const DATA = COUNTRIES.ru.flowers;
const ROUNDS = 10;
const CONFETTI_COLORS = [
  '#c2255c',
  '#faa2c1',
  '#12b886',
  '#ffd43b',
  '#3b6cf6',
  '#ff922b',
];

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

export default function FlowersGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [current, setCurrent] = useState<Flower | null>(null);
  const [opts, setOpts] = useState<Flower[]>([]);
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
  const queue = useRef<Flower[]>([]);

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

  function choose(o: Flower) {
    if (locked || !current) return;
    setLocked(true);
    setPicked(o.n);
    const correct = o.n === current.n;
    if (correct) {
      sfx(true);
      addCoins(1);
      setScore(score + 1);
      setToast({
        head: 'Верно, это ' + current.n.toLowerCase() + '!',
        body: current.fact,
        kind: 'good',
      });
    } else {
      sfx(false);
      setToast({
        head: 'Это ' + current.n.toLowerCase() + '.',
        body: current.fact,
        kind: 'bad',
      });
    }
    setRound(round + 1);
    // факт читаем спокойно — дальше по кнопке
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
    saveBest('flowers', score);
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
        <span className="title">Что это за цветок?</span>
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
            Россия
          </button>
          <button className="pill" type="button" disabled>
            Другие страны — скоро
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
              Посмотри на фото: как называется этот цветок?
            </div>
            <img
              key={photoKey}
              className="photo pop"
              src={current.img}
              alt="Фото цветка-загадки"
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
                  {round >= ROUNDS ? 'Смотреть результат' : 'Следующий цветок'}
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
                ? 'Знаток цветов!'
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
