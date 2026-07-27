import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './fruit-veg.css';

type Item = { e: string; n: string; fruit: boolean; fact: string };

// fruit:true — фрукт, fruit:false — овощ (как на кухне; ботанические сюрпризы — в фактах)
const DATA: Item[] = [
  {
    e: '🍎',
    n: 'Яблоко',
    fruit: true,
    fact: 'Яблоко растёт на дереве в саду. Есть яблони, которым больше 100 лет!',
  },
  {
    e: '🍐',
    n: 'Груша',
    fruit: true,
    fact: 'Груша — фрукт с дерева. Спелая груша слаще многих конфет.',
  },
  {
    e: '🍌',
    n: 'Банан',
    fruit: true,
    fact: 'Банан — фрукт, и растёт он гроздьями, которые смотрят вверх!',
  },
  {
    e: '🍊',
    n: 'Апельсин',
    fruit: true,
    fact: 'Апельсин — фрукт. Его название значит «китайское яблоко».',
  },
  {
    e: '🍋',
    n: 'Лимон',
    fruit: true,
    fact: 'Лимон — очень кислый фрукт, зато в нём много витамина C.',
  },
  {
    e: '🍇',
    n: 'Виноград',
    fruit: true,
    fact: 'Виноград — фрукт. Если его высушить, получится изюм!',
  },
  {
    e: '🍓',
    n: 'Клубника',
    fruit: true,
    fact: 'Клубника — фрукт-ягода, и её семечки растут прямо снаружи!',
  },
  {
    e: '🍒',
    n: 'Вишня',
    fruit: true,
    fact: 'Вишня — фрукт-ягодка с дерева. Из неё варят вкусное варенье.',
  },
  {
    e: '🍑',
    n: 'Персик',
    fruit: true,
    fact: 'Персик — пушистый фрукт. Он приехал к нам из далёкой Персии.',
  },
  {
    e: '🥝',
    n: 'Киви',
    fruit: true,
    fact: 'Киви — фрукт, названный в честь пушистой птички киви!',
  },
  {
    e: '🍍',
    n: 'Ананас',
    fruit: true,
    fact: 'Ананас — фрукт, но растёт не на пальме, а на кустике у самой земли!',
  },
  {
    e: '🥭',
    n: 'Манго',
    fruit: true,
    fact: 'Манго — сладкий фрукт из жарких стран, его зовут королём фруктов.',
  },
  {
    e: '🍉',
    n: 'Арбуз',
    fruit: true,
    fact: 'Арбуз считают фруктом, а учёные говорят: это огромная ягода!',
  },

  {
    e: '🥕',
    n: 'Морковь',
    fruit: false,
    fact: 'Морковь — овощ, мы едим её корешок. Очень полезна для глаз!',
  },
  {
    e: '🥔',
    n: 'Картошка',
    fruit: false,
    fact: 'Картошка — овощ. Её клубни прячутся под землёй, как клад.',
  },
  {
    e: '🍅',
    n: 'Помидор',
    fruit: false,
    fact: 'На кухне помидор — овощ, хотя учёные считают его ягодой!',
  },
  {
    e: '🥒',
    n: 'Огурец',
    fruit: false,
    fact: 'Огурец — овощ, который почти весь состоит из воды.',
  },
  {
    e: '🧅',
    n: 'Лук',
    fruit: false,
    fact: 'Лук — овощ. Он «заставляет плакать», зато прогоняет микробов.',
  },
  {
    e: '🧄',
    n: 'Чеснок',
    fruit: false,
    fact: 'Чеснок — овощ. Его зубчики помогают не простужаться.',
  },
  {
    e: '🥬',
    n: 'Капуста',
    fruit: false,
    fact: 'Капуста — овощ из ста листьев. Недаром говорят: «сто одёжек»!',
  },
  {
    e: '🥦',
    n: 'Брокколи',
    fruit: false,
    fact: 'Брокколи — овощ, похожий на маленькое дерево. Чемпион по витаминам!',
  },
  {
    e: '🍆',
    n: 'Баклажан',
    fruit: false,
    fact: 'Баклажан — овощ в блестящем фиолетовом костюме.',
  },
  {
    e: '🫑',
    n: 'Перец',
    fruit: false,
    fact: 'Сладкий перец — овощ. Он бывает зелёным, жёлтым и красным.',
  },
  {
    e: '🎃',
    n: 'Тыква',
    fruit: false,
    fact: 'Тыква — огромный овощ: бывает тяжелее взрослого человека!',
  },
  {
    e: '🌽',
    n: 'Кукуруза',
    fruit: false,
    fact: 'Кукурузу мы едим как овощ, хотя вообще-то это злак, как пшеница.',
  },
];

const ROUNDS = 12;

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

export default function FruitVegGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [current, setCurrent] = useState<Item | null>(null);
  const [picked, setPicked] = useState<boolean | null>(null); // что нажали: фрукт (true) / овощ (false)
  const [toast, setToast] = useState<{
    kind: 'good' | 'bad';
    lead: string;
    fact: string;
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [bar, setBar] = useState(0);
  const [popKey, setPopKey] = useState(0); // рестарт pop-анимации карточки
  const queue = useRef<Item[]>([]);

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

  function choose(saidFruit: boolean) {
    if (locked || !current) return;
    setLocked(true);
    setPicked(saidFruit);
    const correct = saidFruit === current.fruit;
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
    // читаем факт спокойно — дальше по кнопке
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
        ['#e03131', '#2f9e44', '#e8590c', '#ffd43b', '#ff5a7a', '#3b6cf6'],
        70,
      );
    saveBest('fruitveg', score);
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
        <span className="title">Фрукт или овощ?</span>
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
            <div className="lead">Это фрукт или овощ?</div>
            <div key={popKey} className="item pop">
              <span className="pic">{current.e}</span>
              <span className="name">{current.n}</span>
            </div>
            <div className="opts">
              <button
                className={
                  'opt' +
                  (locked && current.fruit ? ' correct' : '') +
                  (locked && picked === true && !current.fruit ? ' wrong' : '')
                }
                type="button"
                data-fruit=""
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
                    <path d="M12 7.5c-1.2-2.6-4.8-3-6.6-.6-2 2.6-1.4 7.3 1.1 10.6 1.6 2.1 3.1 2.6 4.7 1.6.5-.3 1.1-.3 1.6 0 1.6 1 3.1.5 4.7-1.6 2.5-3.3 3.1-8 1.1-10.6-1.8-2.4-5.4-2-6.6.6z" />
                    <path d="M12 7.5C12 5.5 13 4 15 3.5" />
                  </svg>
                </span>
                <span>
                  <b>Фрукт</b>
                  <small>растёт в саду, сладкий</small>
                </span>
              </button>
              <button
                className={
                  'opt' +
                  (locked && !current.fruit ? ' correct' : '') +
                  (locked && picked === false && current.fruit ? ' wrong' : '')
                }
                type="button"
                data-veg=""
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
                    <path d="M16.2 7.8c2 2 1.6 4.6-1.2 7.4-2.8 2.8-8.2 4.4-11.5 4.8.4-3.3 2-8.7 4.8-11.5 2.8-2.8 5.4-3.2 7.9-.7z" />
                    <path d="M16.2 7.8 20 4M16.2 7.8c.2-1.7 1.6-3 3.3-3.1M16.2 7.8c1.7-.2 3-1.6 3.1-3.3" />
                  </svg>
                </span>
                <span>
                  <b>Овощ</b>
                  <small>растёт на грядке</small>
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
                ? 'Знаток урожая!'
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
