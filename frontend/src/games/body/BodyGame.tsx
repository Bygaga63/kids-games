import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { say, stopVoice } from '@lib/voice';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './body.css';

type BodyPart = { e: string; n: string; riddle: string; fact: string };

// 13 частей тела: загадка + факт
const DATA: BodyPart[] = [
  {
    e: '👀',
    n: 'Глаза',
    riddle: 'Ими мы смотрим на мир, а ночью они закрываются и спят.',
    fact: 'Глаза моргают около 15 раз в минуту, чтобы не пересыхать!',
  },
  {
    e: '👂',
    n: 'Уши',
    riddle: 'Ими мы слушаем сказки и мамин голос.',
    fact: 'Уши не только слышат — они помогают держать равновесие!',
  },
  {
    e: '👃',
    n: 'Нос',
    riddle: 'Им мы нюхаем цветы и свежие пирожки.',
    fact: 'Нос различает тысячи разных запахов.',
  },
  {
    e: '👄',
    n: 'Рот',
    riddle: 'Им мы говорим, поём песенки и улыбаемся.',
    fact: 'Для улыбки работает сразу много мышц лица!',
  },
  {
    e: '👅',
    n: 'Язык',
    riddle: 'Он живёт во рту и различает сладкое, кислое и солёное.',
    fact: 'На языке — тысячи крошечных вкусовых сосочков.',
  },
  {
    e: '🦷',
    n: 'Зубы',
    riddle: 'Они белые и крепкие: грызут яблоки и морковку.',
    fact: 'Молочных зубов у ребёнка ровно 20, потом вырастают новые.',
  },
  {
    e: '💪',
    n: 'Руки',
    riddle: 'Ими мы рисуем, строим башни и обнимаем маму.',
    fact: 'В каждой руке больше 30 косточек!',
  },
  {
    e: '🦵',
    n: 'Ноги',
    riddle: 'Они умеют бегать, прыгать и танцевать.',
    fact: 'Самая большая кость человека — бедренная, она в ноге.',
  },
  {
    e: '🖐️',
    n: 'Пальцы',
    riddle: 'Их по пять на каждой руке, и у каждого есть своё имя.',
    fact: 'Большой, указательный, средний, безымянный и мизинец!',
  },
  {
    e: '🫀',
    n: 'Сердце',
    riddle: 'Оно стучит в груди «тук-тук» и никогда не отдыхает.',
    fact: 'Твоё сердце размером примерно с твой кулачок.',
  },
  {
    e: '🧠',
    n: 'Мозг',
    riddle: 'Он живёт в голове: думает, запоминает и показывает сны.',
    fact: 'Мозг работает даже тогда, когда ты спишь.',
  },
  {
    e: '🫁',
    n: 'Лёгкие',
    riddle: 'Они как два воздушных шарика: надуваются, когда мы вдыхаем.',
    fact: 'Вдох — лёгкие наполняются воздухом, выдох — сдуваются.',
  },
  {
    e: '🦴',
    n: 'Кости',
    riddle: 'Они крепкие и держат всё тело, как каркас у дома.',
    fact: 'В теле человека больше 200 костей!',
  },
];
const ROUNDS = 10;
const CONFETTI_COLORS = [
  '#d9480f',
  '#ff922b',
  '#12b886',
  '#ffd43b',
  '#3b6cf6',
  '#ff5a7a',
];

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

type Toast = { b: string; rest: string; kind: 'good' | 'bad' };

export default function BodyGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [barPct, setBarPct] = useState(0);
  const [locked, setLocked] = useState(false);
  const [current, setCurrent] = useState<BodyPart | null>(null);
  const [opts, setOpts] = useState<BodyPart[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showNext, setShowNext] = useState(false);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [riddleKey, setRiddleKey] = useState(0); // перезапуск pop-анимации

  const queue = useRef<BodyPart[]>([]);

  useEffect(() => {
    syncWallet();
    next(0);
    return () => {
      stopVoice();
    };
  }, []);

  function next(r: number) {
    setLocked(false);
    setPicked(null);
    setShowNext(false);
    setToast(null);
    if (queue.current.length === 0) queue.current = shuffle(DATA);
    const cur = queue.current.shift()!;
    setCurrent(cur);
    const others = shuffle(DATA.filter((d) => d.n !== cur.n));
    setOpts(shuffle([cur, others[0], others[1], others[2]]));
    setRiddleKey((k) => k + 1);
    setBarPct((r / ROUNDS) * 100);
  }

  function choose(o: BodyPart) {
    if (locked || !current) return;
    setLocked(true);
    stopVoice();
    const correct = o.n === current.n;
    setPicked(o.n);
    if (correct) {
      sfx(true);
      addCoins(1);
      setScore((s) => s + 1);
      setToast({
        b: 'Верно, это ' + current.n.toLowerCase() + '!',
        rest: ' ' + current.fact,
        kind: 'good',
      });
    } else {
      sfx(false);
      setToast({
        b: 'Это ' + current.n.toLowerCase() + '.',
        rest: ' ' + current.fact,
        kind: 'bad',
      });
    }
    setRound((r) => r + 1);
    // факт читаем спокойно — дальше по кнопке
    setShowNext(true);
  }

  function onNext() {
    if (round >= ROUNDS) finish();
    else next(round);
  }

  function finish() {
    setFinished(true);
    const stars = score >= 10 ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;
    for (let i = 0; i < stars; i++) {
      setTimeout(() => setStarsOn(i + 1), 200 + i * 220);
    }
    if (stars >= 1) burstConfetti(CONFETTI_COLORS, 70);
    saveBest('body', score);
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
        <span className="title">Части тела</span>
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
            <i style={{ width: `${barPct}%` }} />
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
            <div className="lead">Отгадай, о какой части тела эта загадка</div>
            <div
              key={riddleKey}
              className={'riddle pop' + (locked ? ' done' : '')}
            >
              <span className="mark" aria-hidden="true">
                ?
              </span>
              <span className="reveal" aria-hidden="true">
                {current.e}
              </span>
              <p className="txt">{current.riddle}</p>
              <button
                className="say"
                type="button"
                onClick={() => say(current.riddle)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 10v4h4l5 4V6L8 10H4z" />
                  <path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11" />
                </svg>
                Прочитай мне
              </button>
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
                  <b>{toast.b}</b>
                  {toast.rest}
                </>
              )}
            </div>
            {showNext && (
              <button className="btn next" type="button" onClick={onNext}>
                <span>
                  {round >= ROUNDS ? 'Смотреть результат' : 'Следующая загадка'}
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
                >
                  {STAR}
                </svg>
              ))}
            </div>
            <div className="big">
              {stars === 3
                ? 'Знаток тела!'
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
