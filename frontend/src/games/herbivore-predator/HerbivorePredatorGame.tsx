import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './herbivore-predator.css';

type Animal = {
  e: string;
  n: string;
  img: string;
  herb: boolean;
  fact: string;
};

// herb:true — травоядное, herb:false — хищник
const DATA: Animal[] = [
  {
    e: '🐘',
    n: 'Слон',
    img: '/assets/animals/slon.jpg',
    herb: true,
    fact: 'Слон — травоядный великан: за день съедает до 300 кг растений!',
  },
  {
    e: '🦒',
    n: 'Жираф',
    img: '/assets/animals/zhiraf.jpg',
    herb: true,
    fact: 'Жираф объедает листья с самых высоких веток — длинная шея помогает.',
  },
  {
    e: '🦓',
    n: 'Зебра',
    img: '/assets/animals/zebra.jpg',
    herb: true,
    fact: 'Зебра пасётся в саванне и щиплет траву, как полосатая лошадка.',
  },
  {
    e: '🐄',
    n: 'Корова',
    img: '/assets/animals/korova.jpg',
    herb: true,
    fact: 'Корова ест траву и жуёт её очень-очень долго.',
  },
  {
    e: '🐰',
    n: 'Заяц',
    img: '/assets/animals/zayats.jpg',
    herb: true,
    fact: 'Заяц грызёт травку и кору, а морковку — если очень повезёт.',
  },
  {
    e: '🐴',
    n: 'Лошадь',
    img: '/assets/animals/loshad.jpg',
    herb: true,
    fact: 'Лошадь ест траву и сено, а ещё обожает яблоки.',
  },
  {
    e: '🦌',
    n: 'Олень',
    img: '/assets/animals/olen.jpg',
    herb: true,
    fact: 'Олень ест траву, листья и даже грибы.',
  },
  {
    e: '🐐',
    n: 'Коза',
    img: '/assets/animals/koza.jpg',
    herb: true,
    fact: 'Коза готова жевать почти любую зелень — даже колючки!',
  },
  {
    e: '🐑',
    n: 'Овца',
    img: '/assets/animals/ovtsa.jpg',
    herb: true,
    fact: 'Овца целый день щиплет травку на лугу.',
  },
  {
    e: '🐼',
    n: 'Панда',
    img: '/assets/animals/panda.jpg',
    herb: true,
    fact: 'Панда ест почти один бамбук — жуёт его до 12 часов в день!',
  },
  {
    e: '🦛',
    n: 'Бегемот',
    img: '/assets/animals/begemot.jpg',
    herb: true,
    fact: 'Бегемот выглядит грозно, но он травоядный: съедает 40 кг травы за ночь!',
  },
  {
    e: '🐨',
    n: 'Коала',
    img: '/assets/animals/koala.jpg',
    herb: true,
    fact: 'Коала ест только листья эвкалипта и спит почти весь день.',
  },
  {
    e: '🐫',
    n: 'Верблюд',
    img: '/assets/animals/verblyud.jpg',
    herb: true,
    fact: 'Верблюд жуёт даже колючки пустыни — и подолгу обходится без еды.',
  },

  {
    e: '🦁',
    n: 'Лев',
    img: '/assets/animals/lev.jpg',
    herb: false,
    fact: 'Лев — хищник, царь зверей. А охотятся в прайде чаще всего львицы!',
  },
  {
    e: '🐯',
    n: 'Тигр',
    img: '/assets/animals/tigr.jpg',
    herb: false,
    fact: 'Тигр — самый большой кот на планете и умелый охотник.',
  },
  {
    e: '🐺',
    n: 'Волк',
    img: '/assets/animals/volk.jpg',
    herb: false,
    fact: 'Волки — хищники, они охотятся дружной стаей.',
  },
  {
    e: '🦊',
    n: 'Лиса',
    img: '/assets/animals/lisa.jpg',
    herb: false,
    fact: 'Лиса — хитрая охотница: ловит мышей, ныряя носом в снег!',
  },
  {
    e: '🐊',
    n: 'Крокодил',
    img: '/assets/animals/krokodil.jpg',
    herb: false,
    fact: 'Крокодил — хищник: он умеет часами неподвижно ждать добычу.',
  },
  {
    e: '🦅',
    n: 'Орёл',
    img: '/assets/animals/oryol.jpg',
    herb: false,
    fact: 'Орёл — хищная птица: замечает добычу с огромной высоты.',
  },
  {
    e: '🦈',
    n: 'Акула',
    img: '/assets/animals/akula.jpg',
    herb: false,
    fact: 'Акула — морская хищница, у неё несколько рядов зубов.',
  },
  {
    e: '🐍',
    n: 'Змея',
    img: '/assets/animals/zmeya.jpg',
    herb: false,
    fact: 'Змея — хищница: она проглатывает добычу целиком.',
  },
  {
    e: '🦉',
    n: 'Сова',
    img: '/assets/birds/sova.jpg',
    herb: false,
    fact: 'Сова — ночная охотница с бесшумными мягкими крыльями.',
  },
  {
    e: '🐆',
    n: 'Гепард',
    img: '/assets/animals/gepard.jpg',
    herb: false,
    fact: 'Гепард — хищник и чемпион по бегу: разгоняется быстрее машины во дворе!',
  },
  {
    e: '🐧',
    n: 'Пингвин',
    img: '/assets/animals/pingvin.jpg',
    herb: false,
    fact: 'Сюрприз: пингвин — хищник! Он ныряет и ловит рыбу и рачков.',
  },
  {
    e: '🐬',
    n: 'Дельфин',
    img: '/assets/animals/delfin.jpg',
    herb: false,
    fact: 'Дельфин добрый, но всё-таки хищник: ест рыбу и кальмаров.',
  },
];

const ROUNDS = 12;

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

export default function HerbivorePredatorGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [current, setCurrent] = useState<Animal | null>(null);
  const [picked, setPicked] = useState<boolean | null>(null); // что нажали: травоядное (true) / хищник (false)
  const [toast, setToast] = useState<{
    kind: 'good' | 'bad';
    lead: string;
    fact: string;
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [bar, setBar] = useState(0);
  const [popKey, setPopKey] = useState(0); // рестарт pop-анимации карточки
  const [imgFail, setImgFail] = useState(false); // фото не загрузилось — показываем эмодзи
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
    setImgFail(false);
    setPopKey((k) => k + 1);
    setBar((r / ROUNDS) * 100);
  }

  function choose(saidHerb: boolean) {
    if (locked || !current) return;
    setLocked(true);
    setPicked(saidHerb);
    const correct = saidHerb === current.herb;
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
        ['#2f9e44', '#e8590c', '#12b886', '#ffd43b', '#ff5a7a', '#3b6cf6'],
        70,
      );
    saveBest('predators', score);
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
        <span className="title">Травоядные или хищники</span>
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
            <div className="lead">Этот зверь ест растения или охотится?</div>
            <div key={popKey} className="item pop">
              <img
                className={'photo' + (imgFail ? ' hide' : '')}
                src={current.img}
                alt={current.n}
                onError={() => setImgFail(true)}
              />
              <span className={'pic' + (imgFail ? '' : ' hide')}>
                {current.e}
              </span>
              <span className="name">{current.n}</span>
            </div>
            <div className="opts">
              <button
                className={
                  'opt' +
                  (locked && current.herb ? ' correct' : '') +
                  (locked && picked === true && !current.herb ? ' wrong' : '')
                }
                type="button"
                data-herb=""
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
                    <path d="M6 21C6 11 11 5 21 4c0 10-5 16-15 17z" />
                    <path d="M6 21c2-6 6-10 11-13" />
                  </svg>
                </span>
                <span>
                  <b>Травоядное</b>
                  <small>ест траву и растения</small>
                </span>
              </button>
              <button
                className={
                  'opt' +
                  (locked && !current.herb ? ' correct' : '') +
                  (locked && picked === false && current.herb ? ' wrong' : '')
                }
                type="button"
                data-pred=""
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
                    <circle cx="7.2" cy="7.6" r="1.5" />
                    <circle cx="12" cy="6.4" r="1.5" />
                    <circle cx="16.8" cy="7.6" r="1.5" />
                    <path d="M12 11c-3.1 0-5.6 2.3-5.6 4.8 0 1.7 1.3 3 2.9 3 1 0 1.8-.4 2.7-.4s1.7.4 2.7.4c1.6 0 2.9-1.3 2.9-3 0-2.5-2.5-4.8-5.6-4.8z" />
                  </svg>
                </span>
                <span>
                  <b>Хищник</b>
                  <small>охотится на других</small>
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
