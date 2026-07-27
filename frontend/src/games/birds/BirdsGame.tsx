import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './birds.css';

type Bird = { e: string; n: string; img: string; mig: boolean; fact: string };

// База по странам: пока Россия (средняя полоса). mig:true — перелётная.
const COUNTRIES: { ru: { label: string; birds: Bird[] } } = {
  ru: {
    label: 'Россия',
    birds: [
      {
        e: '🐦‍⬛',
        n: 'Ласточка',
        img: '/assets/birds/lastochka.jpg',
        mig: true,
        fact: 'Ласточка улетает зимовать в Африку — пролетает почти 10 000 км!',
      },
      {
        e: '🐦‍⬛',
        n: 'Стриж',
        img: '/assets/birds/strizh.jpg',
        mig: true,
        fact: 'Стриж почти всю жизнь проводит в небе и зимует в Африке.',
      },
      {
        e: '🐦',
        n: 'Скворец',
        img: '/assets/birds/skvorets.jpg',
        mig: true,
        fact: 'Скворец улетает на юг, а весной возвращается в свой скворечник.',
      },
      {
        e: '🐦‍⬛',
        n: 'Грач',
        img: '/assets/birds/grach.jpg',
        mig: true,
        fact: 'Грачи прилетают самыми первыми — говорят: «Грач весну открывает».',
      },
      {
        e: '🐦',
        n: 'Соловей',
        img: '/assets/birds/solovey.jpg',
        mig: true,
        fact: 'Соловей поёт у нас только летом, а зимует в далёкой Африке.',
      },
      {
        e: '🐦',
        n: 'Кукушка',
        img: '/assets/birds/kukushka.jpg',
        mig: true,
        fact: 'Кукушка осенью тихо улетает в тёплые края, до самой Африки.',
      },
      {
        e: '🐦',
        n: 'Журавль',
        img: '/assets/birds/zhuravl.jpg',
        mig: true,
        fact: 'Журавли улетают на юг красивым клином и громко курлычут.',
      },
      {
        e: '🪿',
        n: 'Дикий гусь',
        img: '/assets/birds/gus.jpg',
        mig: true,
        fact: 'Дикие гуси летят на юг клином и по пути перекликаются.',
      },
      {
        e: '🦢',
        n: 'Лебедь',
        img: '/assets/birds/lebed.jpg',
        mig: true,
        fact: 'Лебеди улетают зимовать на тёплые незамерзающие озёра.',
      },
      {
        e: '🦆',
        n: 'Утка-кряква',
        img: '/assets/birds/kryakva.jpg',
        mig: true,
        fact: 'Кряквы улетают на юг, хотя в городе у тёплой воды некоторые остаются.',
      },
      {
        e: '🐦',
        n: 'Жаворонок',
        img: '/assets/birds/zhavoronok.jpg',
        mig: true,
        fact: 'Жаворонок звенит над полем летом, а зимует на юге.',
      },
      {
        e: '🐦',
        n: 'Аист',
        img: '/assets/birds/aist.jpg',
        mig: true,
        fact: 'Аист строит гнездо на крыше, а зимовать улетает в Африку.',
      },

      {
        e: '🐦',
        n: 'Воробей',
        img: '/assets/birds/vorobey.jpg',
        mig: false,
        fact: 'Воробей живёт рядом с человеком круглый год и никуда не улетает.',
      },
      {
        e: '🐦',
        n: 'Синица',
        img: '/assets/birds/sinitsa.jpg',
        mig: false,
        fact: 'Синица зимует с нами — зимой прилетает к кормушкам за семечками.',
      },
      {
        e: '🐦',
        n: 'Снегирь',
        img: '/assets/birds/snegir.jpg',
        mig: false,
        fact: 'Снегиря с красной грудкой мы видим как раз зимой — на рябине.',
      },
      {
        e: '🐦‍⬛',
        n: 'Ворона',
        img: '/assets/birds/vorona.jpg',
        mig: false,
        fact: 'Ворона остаётся в городе круглый год, зимой ей не страшно.',
      },
      {
        e: '🐦‍⬛',
        n: 'Сорока',
        img: '/assets/birds/soroka.jpg',
        mig: false,
        fact: 'Сорока-белобока никуда не улетает и зимой трещит в парке.',
      },
      {
        e: '🐦',
        n: 'Дятел',
        img: '/assets/birds/dyatel.jpg',
        mig: false,
        fact: 'Дятел и зимой стучит по деревьям — достаёт жучков из-под коры.',
      },
      {
        e: '🕊️',
        n: 'Голубь',
        img: '/assets/birds/golub.jpg',
        mig: false,
        fact: 'Голуби живут в городе круглый год, зимой греются на крышах.',
      },
      {
        e: '🦉',
        n: 'Сова',
        img: '/assets/birds/sova.jpg',
        mig: false,
        fact: 'Сова охотится и зимой — ей помогают тихие мягкие крылья.',
      },
      {
        e: '🐦',
        n: 'Клёст',
        img: '/assets/birds/klest.jpg',
        mig: false,
        fact: 'Клёст такой смелый, что выводит птенцов прямо зимой, в мороз!',
      },
      {
        e: '🐦',
        n: 'Поползень',
        img: '/assets/birds/popolzen.jpg',
        mig: false,
        fact: 'Поползень бегает по стволу даже вниз головой и зимует с нами.',
      },
      {
        e: '🐦',
        n: 'Свиристель',
        img: '/assets/birds/sviristel.jpg',
        mig: false,
        fact: 'Свиристели прилетают к нам именно на зиму — полакомиться рябиной.',
      },
      {
        e: '🐦',
        n: 'Глухарь',
        img: '/assets/birds/glukhar.jpg',
        mig: false,
        fact: 'Глухарь зимует в лесу и в сильный мороз ночует, зарывшись в снег.',
      },
    ],
  },
};

const DATA: Bird[] = COUNTRIES.ru.birds;
const ROUNDS = 12;

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

export default function BirdsGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [pickedMig, setPickedMig] = useState<boolean | null>(null);
  const [toast, setToast] = useState<{
    fact: string;
    kind: 'good' | 'bad';
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [popKey, setPopKey] = useState(0); // перезапуск pop-анимации карточки
  const [current, setCurrent] = useState<Bird | null>(null);
  const [imgError, setImgError] = useState(false); // фото не загрузилось — показываем эмодзи
  const queue = useRef<Bird[]>([]);

  useEffect(() => {
    syncWallet();
    next();
  }, []);

  function next() {
    setLocked(false);
    setPickedMig(null);
    setToast(null);
    setImgError(false);
    if (queue.current.length === 0) queue.current = shuffle(DATA);
    setCurrent(queue.current.shift()!);
    setPopKey((k) => k + 1);
  }

  function choose(saidMig: boolean) {
    if (locked || !current || finished) return;
    setLocked(true);
    setPickedMig(saidMig);
    const correct = saidMig === current.mig;
    if (correct) {
      sfx(true);
      addCoins(1);
      setScore((s) => s + 1);
      setToast({ fact: current.fact, kind: 'good' });
    } else {
      sfx(false);
      setToast({ fact: current.fact, kind: 'bad' });
    }
    setRound((r) => r + 1);
    // без таймера: даём спокойно дочитать факт, дальше — по кнопке
  }

  function onNext() {
    if (round >= ROUNDS) finish();
    else next();
  }

  function finish() {
    setFinished(true);
    const stars = score >= 12 ? 3 : score >= 9 ? 2 : score >= 6 ? 1 : 0;
    for (let i = 0; i < stars; i++) {
      setTimeout(() => setStarsOn(i + 1), 200 + i * 220);
    }
    if (stars >= 1)
      burstConfetti([
        '#66a80f',
        '#1c7ed6',
        '#12b886',
        '#ffd43b',
        '#ff5a7a',
        '#ff922b',
      ]);
    saveBest('birds', score);
  }

  function again() {
    queue.current = [];
    setRound(0);
    setScore(0);
    setFinished(false);
    setStarsOn(0);
    next();
  }

  const endStars = score >= 12 ? 3 : score >= 9 ? 2 : score >= 6 ? 1 : 0;

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
        <span className="title">Перелётные птицы</span>
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
            {COUNTRIES.ru.label}
          </button>
          <button className="pill" type="button" disabled>
            Другие страны — скоро
          </button>
        </div>

        {!finished && (
          <div className="progress playing">
            <i style={{ width: `${(round / ROUNDS) * 100}%` }} />
          </div>
        )}

        {!finished && current && (
          <div
            className="playing"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(14px,3.5vw,22px)',
            }}
          >
            <div className="lead">
              Эта птица улетает на юг или зимует с нами?
            </div>
            <div key={popKey} className="bird pop">
              {!imgError ? (
                <img
                  className="photo"
                  alt={current.n}
                  src={current.img}
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="pic">{current.e}</span>
              )}
              <span className="name">{current.n}</span>
            </div>
            <div className="opts">
              <button
                className={
                  'opt' +
                  (locked && current.mig ? ' correct' : '') +
                  (locked && pickedMig === true && !current.mig ? ' wrong' : '')
                }
                type="button"
                data-mig=""
                disabled={locked}
                onClick={() => choose(true)}
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
                    <path d="M4 5c3 2.5 6 2.5 8 1M9 10c3 2.5 6 2.5 8 1M14 15c2.5 2 5 2 7 .8" />
                    <path d="M17 20l3-3-3-3" />
                  </svg>
                </span>
                <span>
                  <b>Перелётная</b>
                  <small>осенью улетает на юг</small>
                </span>
              </button>
              <button
                className={
                  'opt' +
                  (locked && !current.mig ? ' correct' : '') +
                  (locked && pickedMig === false && current.mig ? ' wrong' : '')
                }
                type="button"
                data-win=""
                disabled={locked}
                onClick={() => choose(false)}
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
                    <path d="M12 3v18M5.5 6.5l13 11M18.5 6.5l-13 11" />
                    <path d="M12 3l-2 2m2-2 2 2M12 21l-2-2m2 2 2-2" />
                  </svg>
                </span>
                <span>
                  <b>Зимующая</b>
                  <small>остаётся с нами зимой</small>
                </span>
              </button>
            </div>
            <div className={'toast' + (toast ? ' ' + toast.kind : '')}>
              {toast && (
                <>
                  <b>{toast.kind === 'good' ? 'Верно!' : 'Не совсем.'}</b>{' '}
                  {toast.fact}
                </>
              )}
            </div>
            {locked && (
              <button className="btn next" type="button" onClick={onNext}>
                <span>
                  {round >= ROUNDS ? 'Смотреть результат' : 'Следующий вопрос'}
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
              {endStars === 3
                ? 'Знаток птиц!'
                : endStars >= 1
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
