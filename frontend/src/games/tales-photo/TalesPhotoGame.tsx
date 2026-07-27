import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './tales-photo.css';

type Hero = { img: string; n: string; line: string };

// Сборники: пока русские сказки — 16 героев на классических иллюстрациях
const COLLECTIONS: Record<string, { label: string; heroes: Hero[] }> = {
  ru: {
    label: 'Русские сказки',
    heroes: [
      {
        img: '/assets/tales/baba-yaga.jpg',
        n: 'Баба-Яга',
        line: 'Живёт в избушке на курьих ножках и летает в ступе.',
      },
      {
        img: '/assets/tales/koschei.jpg',
        n: 'Кощей Бессмертный',
        line: 'Его смерть — на конце иглы, спрятанной в яйце.',
      },
      {
        img: '/assets/tales/zmey.jpg',
        n: 'Змей Горыныч',
        line: 'Трёхголовый змей, каждая голова дышит огнём.',
      },
      {
        img: '/assets/tales/zhar-ptitsa.jpg',
        n: 'Жар-птица',
        line: 'Её перо светится, как огонь.',
      },
      {
        img: '/assets/tales/ivan.jpg',
        n: 'Иван-царевич',
        line: 'Младший царский сын, герой множества сказок.',
      },
      {
        img: '/assets/tales/lyagushka.jpg',
        n: 'Царевна-лягушка',
        line: 'Днём — лягушка, а ночью — прекрасная царевна.',
      },
      {
        img: '/assets/tales/kolobok.jpg',
        n: 'Колобок',
        line: 'Круглый и румяный: ушёл от бабушки и от дедушки.',
      },
      {
        img: '/assets/tales/snegurochka.jpg',
        n: 'Снегурочка',
        line: 'Девочка из снега, внучка Деда Мороза.',
      },
      {
        img: '/assets/tales/ilya.jpg',
        n: 'Илья Муромец',
        line: 'Самый сильный богатырь земли русской.',
      },
      {
        img: '/assets/tales/vasilisa.jpg',
        n: 'Василиса Прекрасная',
        line: 'Умница и красавица, ей помогает волшебная куколка.',
      },
      {
        img: '/assets/tales/emelya.jpg',
        n: 'Емеля',
        line: '«По щучьему велению» — и вёдра идут сами!',
      },
      {
        img: '/assets/tales/ryaba.jpg',
        n: 'Курочка Ряба',
        line: 'Снесла яичко не простое, а золотое.',
      },
      {
        img: '/assets/tales/rybka.jpg',
        n: 'Золотая рыбка',
        line: 'Исполняет желания старика у синего моря.',
      },
      {
        img: '/assets/tales/gusi.jpg',
        n: 'Гуси-лебеди',
        line: 'Служат Бабе-Яге: унесли братца за тёмные леса.',
      },
      {
        img: '/assets/tales/alyonushka.jpg',
        n: 'Алёнушка',
        line: 'Грустит на камне у пруда о братце Иванушке.',
      },
      {
        img: '/assets/tales/vodyanoy.jpg',
        n: 'Водяной',
        line: 'Сказочный хозяин рек, озёр и болот.',
      },
    ],
  },
};

const DATA = COLLECTIONS.ru.heroes;
const ROUNDS = 10;
const CONFETTI_COLORS = [
  '#862e9c',
  '#cc5de8',
  '#12b886',
  '#ffd43b',
  '#3b6cf6',
  '#ff922b',
];

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

export default function TalesPhotoGame() {
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
    saveBest('tales-pic', score);
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
        <span className="title">Кто на картинке?</span>
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
              Посмотри на картинку: кто этот сказочный герой?
            </div>
            <img
              key={photoKey}
              className="photo pop"
              src={current.img}
              alt="Картинка со сказочным героем"
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
