import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './seasons.css';

type SeasonKey = 'zima' | 'vesna' | 'leto' | 'osen';
type Card = { img: string; s: SeasonKey; cap: string };

const NAMES: Record<SeasonKey, string> = {
  zima: 'Зима',
  vesna: 'Весна',
  leto: 'Лето',
  osen: 'Осень',
};

// 16 фотографий: по 4 на каждое время года
const DATA: Card[] = [
  {
    img: '/assets/seasons/zima-1.jpg',
    s: 'zima',
    cap: 'Зимой всё укрыто снегом.',
  },
  {
    img: '/assets/seasons/zima-2.jpg',
    s: 'zima',
    cap: 'Снеговика лепят зимой!',
  },
  {
    img: '/assets/seasons/zima-3.jpg',
    s: 'zima',
    cap: 'Сосульки вырастают на крышах зимой.',
  },
  {
    img: '/assets/seasons/zima-4.jpg',
    s: 'zima',
    cap: 'Сугробы наметает зимняя метель.',
  },
  {
    img: '/assets/seasons/vesna-1.jpg',
    s: 'vesna',
    cap: 'Весной тает снег и всё зеленеет.',
  },
  {
    img: '/assets/seasons/vesna-2.jpg',
    s: 'vesna',
    cap: 'Подснежник — самый первый весенний цветок.',
  },
  {
    img: '/assets/seasons/vesna-3.jpg',
    s: 'vesna',
    cap: 'Весной лёд на реке трескается и плывёт — это ледоход.',
  },
  {
    img: '/assets/seasons/vesna-4.jpg',
    s: 'vesna',
    cap: 'Скворечники вешают весной — ждут птиц из тёплых краёв.',
  },
  {
    img: '/assets/seasons/leto-1.jpg',
    s: 'leto',
    cap: 'Летом тепло, всё цветёт и зеленеет.',
  },
  {
    img: '/assets/seasons/leto-2.jpg',
    s: 'leto',
    cap: 'Подсолнухи распускаются летом и поворачиваются к солнцу.',
  },
  {
    img: '/assets/seasons/leto-3.jpg',
    s: 'leto',
    cap: 'Земляника поспевает летом.',
  },
  {
    img: '/assets/seasons/leto-4.jpg',
    s: 'leto',
    cap: 'Ромашковые луга цветут летом.',
  },
  {
    img: '/assets/seasons/osen-1.jpg',
    s: 'osen',
    cap: 'Осенью листья желтеют и краснеют.',
  },
  {
    img: '/assets/seasons/osen-2.jpg',
    s: 'osen',
    cap: 'Листопад — это осень: листья кружатся и падают.',
  },
  {
    img: '/assets/seasons/osen-3.jpg',
    s: 'osen',
    cap: 'Тыквы и весь урожай собирают осенью.',
  },
  {
    img: '/assets/seasons/osen-4.jpg',
    s: 'osen',
    cap: 'Жёлуди падают с дубов осенью.',
  },
];

const ROUNDS = 10;
const CONFETTI_COLORS = [
  '#339af0',
  '#40c057',
  '#fab005',
  '#f76707',
  '#ff5a7a',
  '#3bc9db',
];

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

const ICONS: Record<SeasonKey, React.ReactNode> = {
  zima: <path d="M12 3v18M5.5 6.5l13 11M18.5 6.5l-13 11" />,
  vesna: (
    <>
      <path d="M12 21v-8" />
      <path d="M12 13c0-4-3-6.5-7-6.5 0 4 3 6.5 7 6.5z" />
      <path d="M12 11c0-3.5 2.5-5.5 6-5.5 0 3.5-2.5 5.5-6 5.5z" />
    </>
  ),
  leto: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M19.5 4.5l-1.8 1.8M6.3 17.7l-1.8 1.8" />
    </>
  ),
  osen: (
    <>
      <path d="M6 21C6 11 11 5 21 4c0 10-5 16-15 17z" />
      <path d="M6 21c2-6 6-10 11-13" />
    </>
  ),
};

const SEASON_KEYS: SeasonKey[] = ['zima', 'vesna', 'leto', 'osen'];

export default function SeasonsGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [current, setCurrent] = useState<Card | null>(null);
  const [picked, setPicked] = useState<SeasonKey | null>(null);
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
  const queue = useRef<Card[]>([]);

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
    setCurrent(queue.current.shift()!);
    setPhotoKey((k) => k + 1);
    setBarWidth((r / ROUNDS) * 100);
  }

  function choose(s: SeasonKey) {
    if (locked || !current) return;
    setLocked(true);
    setPicked(s);
    const correct = s === current.s;
    if (correct) {
      sfx(true);
      addCoins(1);
      setScore(score + 1);
      setToast({
        head: 'Верно, это ' + NAMES[current.s].toLowerCase() + '!',
        body: current.cap,
        kind: 'good',
      });
    } else {
      sfx(false);
      setToast({
        head: 'Это ' + NAMES[current.s].toLowerCase() + '.',
        body: current.cap,
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
    saveBest('seasons', score);
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
        <span className="title">Времена года</span>
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
              Посмотри на картинку: какое это время года?
            </div>
            <img
              key={photoKey}
              className="photo pop"
              src={current.img}
              alt="Картинка-загадка: какое время года?"
            />
            <div className="opts">
              {SEASON_KEYS.map((s) => (
                <button
                  key={s}
                  className={
                    'opt' +
                    (locked && s === current.s ? ' correct' : '') +
                    (locked && picked === s && s !== current.s ? ' wrong' : '')
                  }
                  type="button"
                  data-s={s}
                  disabled={locked}
                  onClick={() => choose(s)}
                >
                  <span className="ic" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {ICONS[s]}
                    </svg>
                  </span>
                  <b>{NAMES[s]}</b>
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
                  {round >= ROUNDS
                    ? 'Смотреть результат'
                    : 'Следующая картинка'}
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
                ? 'Знаток времён года!'
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
