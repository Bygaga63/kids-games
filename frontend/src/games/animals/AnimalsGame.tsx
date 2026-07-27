import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './animals.css';

type Animal = { n: string; e: string; s: string; say: string; fact: string };

const DATA: Animal[] = [
  {
    n: 'Кошка',
    e: '🐱',
    s: 'Мяу',
    say: 'Мяу',
    fact: 'Живёт дома и ловит мышей',
  },
  {
    n: 'Собака',
    e: '🐶',
    s: 'Гав-гав',
    say: 'Гав гав',
    fact: 'Верный друг человека',
  },
  {
    n: 'Корова',
    e: '🐮',
    s: 'Му-у',
    say: 'Мууу',
    fact: 'Живёт на ферме и даёт молоко',
  },
  {
    n: 'Петух',
    e: '🐓',
    s: 'Ку-ка-ре-ку',
    say: 'Кукареку',
    fact: 'Будит всех утром на ферме',
  },
  {
    n: 'Лягушка',
    e: '🐸',
    s: 'Ква-ква',
    say: 'Ква ква',
    fact: 'Живёт у пруда',
  },
  { n: 'Овечка', e: '🐑', s: 'Бе-е', say: 'Бее', fact: 'Даёт тёплую шерсть' },
  { n: 'Утка', e: '🦆', s: 'Кря-кря', say: 'Кря кря', fact: 'Плавает в пруду' },
  {
    n: 'Свинка',
    e: '🐷',
    s: 'Хрю-хрю',
    say: 'Хрю хрю',
    fact: 'Живёт на ферме',
  },
  {
    n: 'Лошадка',
    e: '🐴',
    s: 'И-го-го',
    say: 'Иго-го',
    fact: 'Быстро скачет, живёт в конюшне',
  },
  {
    n: 'Лев',
    e: '🦁',
    s: 'Р-р-р',
    say: 'Ррр',
    fact: 'Царь зверей, живёт в Африке',
  },
  { n: 'Пчёлка', e: '🐝', s: 'Ж-ж-ж', say: 'Жжж', fact: 'Делает сладкий мёд' },
  {
    n: 'Сова',
    e: '🦉',
    s: 'У-ху',
    say: 'Уху',
    fact: 'Живёт в лесу и не спит ночью',
  },
];

const ROUNDS = 10;

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

// озвучка как в оригинале: rate .85, pitch 1.2, русский голос
function speak(txt: string): void {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'ru-RU';
    u.rate = 0.85;
    u.pitch = 1.2;
    const vs = window.speechSynthesis.getVoices();
    const ru = vs.filter((v) => /ru/i.test(v.lang))[0];
    if (ru) u.voice = ru;
    window.speechSynthesis.speak(u);
  } catch {}
}

type Question = { current: Animal; choices: Animal[] };

function makeQuestion(): Question {
  const pool = shuffle(DATA);
  return {
    current: pool[0],
    choices: shuffle([pool[0], pool[1], pool[2], pool[3]]),
  };
}

export default function AnimalsGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    text: string;
    kind: 'good' | 'bad';
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [popKey, setPopKey] = useState(0); // перезапуск pop-анимации
  const [ringKey, setRingKey] = useState(0); // перезапуск ring-анимации кнопки озвучки
  const [question, setQuestion] = useState<Question | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    syncWallet();
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
    next();
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);

  function next() {
    setLocked(false);
    setPicked(null);
    setToast(null);
    setQuestion(makeQuestion());
    setPopKey((k) => k + 1);
  }

  function choose(o: Animal, idx: number) {
    if (locked || !question || finished) return;
    setLocked(true);
    setPicked(idx);
    const correct = o.n === question.current.n;
    if (correct) {
      sfx(true);
      addCoins(1);
      setScore((s) => s + 1);
      setToast({ text: 'Верно! ' + question.current.fact, kind: 'good' });
      speak(question.current.say);
    } else {
      sfx(false);
      setToast({
        text: question.current.n + ' говорит «' + question.current.s + '»',
        kind: 'bad',
      });
    }
    const newRound = round + 1;
    setRound(newRound);
    timer.current = window.setTimeout(
      () => {
        if (newRound >= ROUNDS) finish(correct ? score + 1 : score);
        else next();
      },
      correct ? 1300 : 1500,
    );
  }

  function finish(finalScore: number) {
    setFinished(true);
    const stars =
      finalScore >= 10 ? 3 : finalScore >= 7 ? 2 : finalScore >= 4 ? 1 : 0;
    for (let i = 0; i < stars; i++) {
      setTimeout(() => setStarsOn(i + 1), 200 + i * 220);
    }
    if (stars >= 1)
      burstConfetti([
        '#0ca678',
        '#3b6cf6',
        '#ffd43b',
        '#ff922b',
        '#ff5a7a',
        '#9775fa',
      ]);
    saveBest('animals', finalScore);
  }

  function again() {
    setRound(0);
    setScore(0);
    setFinished(false);
    setStarsOn(0);
    next();
  }

  function sayName() {
    setRingKey((k) => k + 1);
    if (question) speak(question.current.n);
  }

  const endStars = score >= 10 ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;

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
        <span className="title">Кто как говорит?</span>
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
            <i style={{ width: `${(round / ROUNDS) * 100}%` }} />
          </div>
        )}

        {!finished && question && (
          <div
            className="playing"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(14px,4vw,24px)',
            }}
          >
            <div className="lead">
              Как говорит <b>{question.current.n.toLowerCase()}</b>?
            </div>
            <div className="creature">
              <div key={popKey} className="animal pop" aria-hidden="true">
                {question.current.e}
              </div>
              <button
                key={ringKey}
                className={'say' + (ringKey > 0 ? ' ring' : '')}
                type="button"
                aria-label="Назвать животное"
                onClick={sayName}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 5 6 9H3v6h3l5 4z" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                </svg>
              </button>
            </div>
            <div className={'toast' + (toast ? ' ' + toast.kind : '')}>
              {toast?.text ?? ''}
            </div>
            <div className="opts">
              {question.choices.map((o, idx) => (
                <button
                  key={o.n}
                  type="button"
                  disabled={locked}
                  className={
                    'opt' +
                    (locked && o.s === question.current.s ? ' correct' : '') +
                    (locked && picked === idx && o.n !== question.current.n
                      ? ' wrong'
                      : '')
                  }
                  onClick={() => choose(o, idx)}
                >
                  {'«' + o.s + '»'}
                </button>
              ))}
            </div>
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
                ? 'Юный зоолог!'
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
