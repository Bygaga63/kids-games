import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './emotions.css';

type Emo = { e: string; img: string; n: string; tip: string };

// 12 эмоций: картинка (OpenMoji, см. /assets/emotions/credits.txt), эмодзи-фолбэк, название, добрый совет
const DATA: Emo[] = [
  {
    e: '😄',
    img: '/assets/emotions/radost.png',
    n: 'Радость',
    tip: 'Когда мы радуемся, хочется прыгать и смеяться. Поделись радостью — её станет больше!',
  },
  {
    e: '😢',
    img: '/assets/emotions/grust.png',
    n: 'Грусть',
    tip: 'Грустить — нормально. Помогает рассказать о грусти маме или папе.',
  },
  {
    e: '😠',
    img: '/assets/emotions/zlost.png',
    n: 'Злость',
    tip: 'Когда злишься, помогает глубоко подышать: вдо-о-ох и вы-ы-ыдох. И злость улетает!',
  },
  {
    e: '😨',
    img: '/assets/emotions/strah.png',
    n: 'Страх',
    tip: 'Бояться — не стыдно. Смелый не тот, кто не боится, а тот, кто справляется!',
  },
  {
    e: '😲',
    img: '/assets/emotions/udivlenie.png',
    n: 'Удивление',
    tip: 'Мы удивляемся, когда случается что-то неожиданное. Вот это да!',
  },
  {
    e: '😌',
    img: '/assets/emotions/spokoystvie.png',
    n: 'Спокойствие',
    tip: 'Спокойствие — как тихая вода. В нём хорошо думается и отдыхается.',
  },
  {
    e: '😴',
    img: '/assets/emotions/ustalost.png',
    n: 'Усталость',
    tip: 'Когда устал, лучший помощник — отдых и крепкий сон.',
  },
  {
    e: '😳',
    img: '/assets/emotions/smushchenie.png',
    n: 'Смущение',
    tip: 'Щёки краснеют, хочется спрятаться? Это смущение, оно бывает у всех.',
  },
  {
    e: '🤔',
    img: '/assets/emotions/zadumchivost.png',
    n: 'Задумчивость',
    tip: 'Когда мы думаем, мозг тренируется — как мышцы на зарядке!',
  },
  {
    e: '🥳',
    img: '/assets/emotions/vostorg.png',
    n: 'Восторг',
    tip: 'Восторг — это радость размером с праздник!',
  },
  {
    e: '🥺',
    img: '/assets/emotions/obida.png',
    n: 'Обида',
    tip: 'Если обидели — скажи словами: «Мне обидно». Это очень помогает.',
  },
  {
    e: '🥰',
    img: '/assets/emotions/lyubov.png',
    n: 'Любовь',
    tip: 'Любовь — когда кто-то очень-очень дорог. Обними того, кого любишь!',
  },
];

const ROUNDS = 10;

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

export default function EmotionsGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [current, setCurrent] = useState<Emo | null>(null);
  const [opts, setOpts] = useState<Emo[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    kind: 'good' | 'bad';
    lead: string;
    tip: string;
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [bar, setBar] = useState(0);
  const [popKey, setPopKey] = useState(0); // рестарт pop-анимации лица
  const [imgFail, setImgFail] = useState(false); // не загрузилась картинка — покажем эмодзи
  const queue = useRef<Emo[]>([]);

  useEffect(() => {
    syncWallet();
    next(0);
  }, []);

  function next(r: number) {
    setLocked(false);
    setPicked(null);
    setToast(null);
    setImgFail(false);
    if (queue.current.length === 0) queue.current = shuffle(DATA);
    const cur = queue.current.shift()!;
    setCurrent(cur);
    setPopKey((k) => k + 1);
    const others = shuffle(DATA.filter((d) => d.n !== cur.n));
    setOpts(shuffle([cur, others[0], others[1], others[2]]));
    setBar((r / ROUNDS) * 100);
  }

  function choose(o: Emo) {
    if (locked || !current) return;
    setLocked(true);
    setPicked(o.n);
    const correct = o.n === current.n;
    if (correct) {
      sfx(true);
      addCoins(1);
      setScore((s) => s + 1);
      setToast({
        kind: 'good',
        lead: 'Верно, это ' + current.n.toLowerCase() + '!',
        tip: current.tip,
      });
    } else {
      sfx(false);
      setToast({
        kind: 'bad',
        lead: 'Это ' + current.n.toLowerCase() + '.',
        tip: current.tip,
      });
    }
    setRound(round + 1);
    // совет читаем без спешки — дальше по кнопке
  }

  function onNext() {
    if (round >= ROUNDS) finish();
    else next(round);
  }

  function finish() {
    setBar(100);
    setFinished(true);
    const stars = score >= 10 ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;
    for (let i = 0; i < stars; i++) {
      setTimeout(() => setStarsOn(i + 1), 200 + i * 220);
    }
    if (stars >= 1)
      burstConfetti(
        ['#be4bdb', '#3b6cf6', '#12b886', '#ffd43b', '#ff5a7a', '#ff922b'],
        70,
      );
    saveBest('emotions', score);
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
        <span className="title">Отгадай эмоцию</span>
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
            <div className="lead">Что чувствует этот человечек?</div>
            <div key={popKey} className="face pop">
              {imgFail ? (
                current.e
              ) : (
                <img
                  src={current.img}
                  alt=""
                  draggable={false}
                  onError={() => setImgFail(true)}
                />
              )}
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
                  <b>{toast.lead}</b> {toast.tip}
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
                ? 'Знаток чувств!'
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
