import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './trees.css';

type Tree = { img: string; n: string; fact: string };

// База по странам: пока Россия — 15 деревьев лесов, парков и садов
const COUNTRIES: Record<string, { label: string; trees: Tree[] }> = {
  ru: {
    label: 'Россия',
    trees: [
      {
        img: '/assets/trees/bereza.jpg',
        n: 'Берёза',
        fact: 'Берёзу узнают по белому стволу с чёрными чёрточками.',
      },
      {
        img: '/assets/trees/dub.jpg',
        n: 'Дуб',
        fact: 'Дуб — могучее дерево с желудями. Может прожить сотни лет!',
      },
      {
        img: '/assets/trees/el.jpg',
        n: 'Ель',
        fact: 'Ель — колючая красавица, которая приходит к нам на Новый год.',
      },
      {
        img: '/assets/trees/sosna.jpg',
        n: 'Сосна',
        fact: 'У сосны длинные иголки и рыжий ствол, а пахнет она смолой.',
      },
      {
        img: '/assets/trees/klen.jpg',
        n: 'Клён',
        fact: 'У клёна листья-звёздочки, а семена летят, как вертолётики!',
      },
      {
        img: '/assets/trees/ryabina.jpg',
        n: 'Рябина',
        fact: 'Красные гроздья рябины кормят птиц всю зиму.',
      },
      {
        img: '/assets/trees/lipa.jpg',
        n: 'Липа',
        fact: 'Липа цветёт так душисто, что пчёлы делают из неё липовый мёд.',
      },
      {
        img: '/assets/trees/osina.jpg',
        n: 'Осина',
        fact: 'Листья осины дрожат даже от самого лёгкого ветерка.',
      },
      {
        img: '/assets/trees/iva.jpg',
        n: 'Ива',
        fact: 'Ива склоняет ветви к самой воде — её зовут плакучей.',
      },
      {
        img: '/assets/trees/topol.jpg',
        n: 'Тополь',
        fact: 'Тополиный пух летит в июне, как летний снег.',
      },
      {
        img: '/assets/trees/cheryomuha.jpg',
        n: 'Черёмуха',
        fact: 'Черёмуха цветёт в мае белыми душистыми кистями.',
      },
      {
        img: '/assets/trees/kashtan.jpg',
        n: 'Каштан',
        fact: 'Весной каштан зажигает «свечки», а осенью роняет блестящие орешки.',
      },
      {
        img: '/assets/trees/listvennitsa.jpg',
        n: 'Лиственница',
        fact: 'Лиственница — хвойное дерево, но на зиму сбрасывает иголки!',
      },
      {
        img: '/assets/trees/kedr.jpg',
        n: 'Кедр',
        fact: 'На сибирском кедре растут шишки с вкусными кедровыми орешками.',
      },
      {
        img: '/assets/trees/yablonya.jpg',
        n: 'Яблоня',
        fact: 'Яблоня весной вся в цвету, а осенью дарит нам яблоки.',
      },
    ],
  },
};

const DATA = COUNTRIES.ru.trees;
const ROUNDS = 10;
const CONFETTI_COLORS = [
  '#087f5b',
  '#55d0ac',
  '#66a80f',
  '#ffd43b',
  '#3b6cf6',
  '#ff922b',
];

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

export default function TreesGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [current, setCurrent] = useState<Tree | null>(null);
  const [opts, setOpts] = useState<Tree[]>([]);
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
  const queue = useRef<Tree[]>([]);

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

  function choose(o: Tree) {
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
    saveBest('trees', score);
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
        <span className="title">Что это за дерево?</span>
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
              Посмотри на фото: как называется это дерево?
            </div>
            <img
              key={photoKey}
              className="photo pop"
              src={current.img}
              alt="Фото дерева-загадки"
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
                  {round >= ROUNDS ? 'Смотреть результат' : 'Следующее дерево'}
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
                ? 'Знаток деревьев!'
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
