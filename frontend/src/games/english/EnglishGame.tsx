import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { say } from '@lib/voice';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './english.css';

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ROUNDS = 10;
const CONFETTI_COLORS = [
  '#0c8599',
  '#3b6cf6',
  '#ffd43b',
  '#40c057',
  '#ff922b',
  '#ff5a7a',
];

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

// озвучка буквы — предзаписанный клип, при отсутствии — speechSynthesis
const speak = (ch: string) => say(ch, 'en-letter');

export default function EnglishGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [current, setCurrent] = useState('A');
  const [opts, setOpts] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    text: string;
    kind: 'good' | 'bad';
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [popKey, setPopKey] = useState(0); // перезапуск pop-анимации буквы
  const sayRef = useRef<HTMLButtonElement>(null);
  const speakTimer = useRef<number | null>(null);

  useEffect(() => {
    syncWallet();
    next(0);
    return () => {
      if (speakTimer.current) clearTimeout(speakTimer.current);
    };
  }, []);

  function next(_round: number) {
    setLocked(false);
    setPicked(null);
    setToast(null);
    const pool = shuffle(ALPHA);
    const target = pool[0];
    setCurrent(target);
    setOpts(shuffle([pool[0], pool[1], pool[2], pool[3]]));
    setPopKey((k) => k + 1);
    if (speakTimer.current) clearTimeout(speakTimer.current);
    speakTimer.current = window.setTimeout(() => speak(target), 350);
  }

  function choose(ch: string) {
    if (locked || finished) return;
    setLocked(true);
    setPicked(ch);
    const correct = ch === current;
    let newScore = score;
    if (correct) {
      sfx(true);
      addCoins(1);
      newScore = score + 1;
      setScore(newScore);
      setToast({ text: 'Верно! Это «' + current + '»', kind: 'good' });
    } else {
      sfx(false);
      setToast({ text: 'Это буква «' + current + '»', kind: 'bad' });
    }
    const newRound = round + 1;
    setRound(newRound);
    setTimeout(
      () => {
        if (newRound >= ROUNDS) finish(newScore);
        else next(newRound);
      },
      correct ? 800 : 1300,
    );
  }

  function finish(finalScore: number) {
    setFinished(true);
    const stars =
      finalScore >= 10 ? 3 : finalScore >= 7 ? 2 : finalScore >= 4 ? 1 : 0;
    for (let i = 0; i < stars; i++) {
      setTimeout(() => setStarsOn(i + 1), 200 + i * 220);
    }
    if (stars >= 1) burstConfetti(CONFETTI_COLORS);
    saveBest('english', finalScore);
  }

  function again() {
    setRound(0);
    setScore(0);
    setFinished(false);
    setStarsOn(0);
    next(0);
  }

  function onSay() {
    const el = sayRef.current;
    if (el) {
      el.classList.remove('ring');
      void el.offsetWidth;
      el.classList.add('ring');
    }
    speak(current);
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
        <span className="title">English ABC</span>
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

        {!finished && (
          <div
            className="playing"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(16px,4vw,26px)',
            }}
          >
            <div className="lead">
              Послушай букву и найди такую же маленькую
            </div>
            <div className="target">
              <div key={popKey} className="letter pop">
                {current}
              </div>
              <button
                ref={sayRef}
                className="say"
                type="button"
                aria-label="Listen to the letter"
                onClick={onSay}
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
              {opts.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  disabled={locked}
                  className={
                    'opt' +
                    (locked && ch === current ? ' correct' : '') +
                    (locked && picked === ch && ch !== current ? ' wrong' : '')
                  }
                  onClick={() => choose(ch)}
                >
                  {ch.toLowerCase()}
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
              {stars === 3
                ? 'Perfect!'
                : stars >= 1
                  ? 'Great job!'
                  : 'Try again!'}
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
