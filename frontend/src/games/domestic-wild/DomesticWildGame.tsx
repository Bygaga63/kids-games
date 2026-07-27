import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './domestic-wild.css';

type Animal = { e: string; n: string; home: boolean; fact: string };

// home:true — домашнее, home:false — дикое
const DATA: Animal[] = [
  {
    e: '🐶',
    n: 'Собака',
    home: true,
    fact: 'Собака — первый друг человека: она рядом с нами уже тысячи лет!',
  },
  {
    e: '🐱',
    n: 'Кошка',
    home: true,
    fact: 'Кошка живёт дома, мурлычет и ловко ловит мышей.',
  },
  {
    e: '🐄',
    n: 'Корова',
    home: true,
    fact: 'Корова живёт на ферме и даёт нам молоко.',
  },
  {
    e: '🐴',
    n: 'Лошадь',
    home: true,
    fact: 'Лошадь — домашняя помощница: катает людей и возит грузы.',
  },
  {
    e: '🐐',
    n: 'Коза',
    home: true,
    fact: 'Коза даёт молоко, из которого делают вкусный сыр.',
  },
  {
    e: '🐑',
    n: 'Овца',
    home: true,
    fact: 'Из шерсти овцы вяжут тёплые свитера и носки.',
  },
  {
    e: '🐷',
    n: 'Свинья',
    home: true,
    fact: 'Свинья живёт на ферме. В грязи она купается, чтобы охладиться!',
  },
  {
    e: '🐔',
    n: 'Курица',
    home: true,
    fact: 'Курица живёт в курятнике и несёт яйца почти каждый день.',
  },
  {
    e: '🐓',
    n: 'Петух',
    home: true,
    fact: 'Петух — будильник фермы: кукарекает на рассвете.',
  },
  {
    e: '🐰',
    n: 'Кролик',
    home: true,
    fact: 'Кролик — домашний. А его дикий родственник — заяц!',
  },
  {
    e: '🐹',
    n: 'Хомячок',
    home: true,
    fact: 'Хомячок — домашний питомец: прячет еду за пухлые щёчки.',
  },
  {
    e: '🫏',
    n: 'Ослик',
    home: true,
    fact: 'Ослик — домашний трудяга: помогает возить тяжёлые грузы.',
  },

  {
    e: '🐺',
    n: 'Волк',
    home: false,
    fact: 'Волк — дикий житель леса. Он дальний родственник собаки!',
  },
  {
    e: '🦊',
    n: 'Лиса',
    home: false,
    fact: 'Лиса — дикая: живёт в лесу, в уютной норе.',
  },
  {
    e: '🐻',
    n: 'Медведь',
    home: false,
    fact: 'Медведь — дикий: летом ест ягоды и мёд, а зимой спит в берлоге.',
  },
  {
    e: '🐇',
    n: 'Заяц',
    home: false,
    fact: 'Заяц — дикий: летом он серый, а зимой белый, чтобы прятаться в снегу.',
  },
  {
    e: '🫎',
    n: 'Лось',
    home: false,
    fact: 'Лось — дикий великан леса с рогами, как ветвистое дерево.',
  },
  {
    e: '🦔',
    n: 'Ёжик',
    home: false,
    fact: 'Ёжик — дикий: живёт в лесу и на всю зиму засыпает.',
  },
  {
    e: '🐿️',
    n: 'Белка',
    home: false,
    fact: 'Белка — дикая: прячет орешки в дупле на зиму.',
  },
  {
    e: '🐗',
    n: 'Кабан',
    home: false,
    fact: 'Кабан — дикий родственник домашней свиньи.',
  },
  {
    e: '🐯',
    n: 'Тигр',
    home: false,
    fact: 'Тигр — дикий: живёт в далёкой тайге и джунглях.',
  },
  {
    e: '🐘',
    n: 'Слон',
    home: false,
    fact: 'Слон — дикий: гуляет по саванне и джунглям.',
  },
  {
    e: '🐒',
    n: 'Обезьяна',
    home: false,
    fact: 'Обезьяны — дикие: прыгают по деревьям в жарких странах.',
  },
  {
    e: '🦒',
    n: 'Жираф',
    home: false,
    fact: 'Жираф — дикий житель африканской саванны.',
  },
];

const ROUNDS = 12;

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

export default function DomesticWildGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [current, setCurrent] = useState<Animal | null>(null);
  const [picked, setPicked] = useState<boolean | null>(null); // что нажали: домашнее (true) / дикое (false)
  const [toast, setToast] = useState<{
    kind: 'good' | 'bad';
    lead: string;
    fact: string;
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [bar, setBar] = useState(0);
  const [popKey, setPopKey] = useState(0); // рестарт pop-анимации карточки
  const queue = useRef<Animal[]>([]);

  useEffect(() => {
    syncWallet();
    next(0);
  }, []);

  function next(r: number) {
    setLocked(false);
    setPicked(null);
    setToast(null);
    if (queue.current.length === 0) queue.current = shuffle(DATA);
    setCurrent(queue.current.shift()!);
    setPopKey((k) => k + 1);
    setBar((r / ROUNDS) * 100);
  }

  function choose(saidHome: boolean) {
    if (locked || !current) return;
    setLocked(true);
    setPicked(saidHome);
    const correct = saidHome === current.home;
    if (correct) {
      sfx(true);
      addCoins(1);
      setScore((s) => s + 1);
      setToast({ kind: 'good', lead: 'Верно!', fact: current.fact });
    } else {
      sfx(false);
      setToast({ kind: 'bad', lead: 'Не совсем.', fact: current.fact });
    }
    setRound(round + 1);
    // факт читаем спокойно — дальше по кнопке
  }

  function onNext() {
    if (round >= ROUNDS) finish();
    else next(round);
  }

  function finish() {
    setBar(100);
    setFinished(true);
    const stars = score >= 12 ? 3 : score >= 9 ? 2 : score >= 6 ? 1 : 0;
    for (let i = 0; i < stars; i++) {
      setTimeout(() => setStarsOn(i + 1), 200 + i * 220);
    }
    if (stars >= 1)
      burstConfetti(
        ['#e67700', '#2f9e44', '#12b886', '#ffd43b', '#ff5a7a', '#3b6cf6'],
        70,
      );
    saveBest('domestic', score);
  }

  function again() {
    setRound(0);
    setScore(0);
    queue.current = [];
    setFinished(false);
    setStarsOn(0);
    next(0);
  }

  const stars = score >= 12 ? 3 : score >= 9 ? 2 : score >= 6 ? 1 : 0;

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
        <span className="title">Домашние или дикие</span>
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
            <i style={{ width: `${bar}%` }} />
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
              Этот зверь живёт с человеком или в дикой природе?
            </div>
            <div key={popKey} className="item pop">
              <span className="pic">{current.e}</span>
              <span className="name">{current.n}</span>
            </div>
            <div className="opts">
              <button
                className={
                  'opt' +
                  (locked && current.home ? ' correct' : '') +
                  (locked && picked === true && !current.home ? ' wrong' : '')
                }
                type="button"
                data-home=""
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
                    <path d="M4 11 12 4l8 7" />
                    <path d="M6 10v9h12v-9" />
                    <path d="M10 19v-5h4v5" />
                  </svg>
                </span>
                <span>
                  <b>Домашнее</b>
                  <small>живёт с человеком</small>
                </span>
              </button>
              <button
                className={
                  'opt' +
                  (locked && !current.home ? ' correct' : '') +
                  (locked && picked === false && current.home ? ' wrong' : '')
                }
                type="button"
                data-wild=""
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
                    <path d="M12 3 6.5 11h3L5 18h14l-4.5-7h3z" />
                    <path d="M12 18v3" />
                  </svg>
                </span>
                <span>
                  <b>Дикое</b>
                  <small>живёт в лесу и саванне</small>
                </span>
              </button>
            </div>
            <div className={'toast' + (toast ? ' ' + toast.kind : '')}>
              {toast && (
                <>
                  <b>{toast.lead}</b> {toast.fact}
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
              {stars === 3
                ? 'Знаток зверей!'
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
