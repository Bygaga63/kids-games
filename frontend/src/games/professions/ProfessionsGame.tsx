import { useEffect, useMemo, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx, speak } from '@lib/sfx';
import { stopVoice } from '@lib/voice';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './professions.css';

type Prof = {
  /** название профессии */
  n: string;
  /** эмодзи-человек */
  p: string;
  /** эмодзи-инструмент */
  t: string;
  /** чем занимается — детским языком, продолжение вопроса «Кто ...?» */
  d: string;
  /** группа похожих дел: такие профессии не попадают в варианты вместе */
  g?: string;
};

// Эмодзи мужские и женские чередуются, чтобы не закреплять стереотипы.
const PROFS: Prof[] = [
  { n: 'Врач', p: '👩‍⚕️', t: '🩺', d: 'лечит людей', g: 'heal' },
  { n: 'Пожарный', p: '👨‍🚒', t: '🧯', d: 'тушит огонь и спасает людей' },
  { n: 'Повар', p: '👨‍🍳', t: '🍳', d: 'готовит вкусный суп и котлеты' },
  { n: 'Парикмахер', p: '💇‍♂️', t: '✂️', d: 'стрижёт волосы и делает причёски' },
  { n: 'Строитель', p: '👷‍♀️', t: '🔨', d: 'строит новые дома' },
  { n: 'Художник', p: '👨‍🎨', t: '🎨', d: 'рисует картины красками' },
  { n: 'Учитель', p: '👩‍🏫', t: '📚', d: 'учит детей читать и считать' },
  { n: 'Тракторист', p: '👩‍🌾', t: '🚜', d: 'пашет поле на большом тракторе' },
  { n: 'Пилот', p: '👩‍✈️', t: '✈️', d: 'водит самолёт высоко в небе' },
  { n: 'Музыкант', p: '👨‍🎤', t: '🎻', d: 'играет музыку на скрипке' },
  { n: 'Почтальон', p: '🧑‍💼', t: '📬', d: 'разносит по домам письма и посылки' },
  { n: 'Полицейский', p: '👮‍♀️', t: '🚓', d: 'следит за порядком на улице' },
  { n: 'Космонавт', p: '👨‍🚀', t: '🚀', d: 'летает в космос на ракете' },
  { n: 'Учёный', p: '👩‍🔬', t: '🔬', d: 'смотрит в микроскоп и делает опыты' },
  { n: 'Механик', p: '👨‍🔧', t: '🔧', d: 'ремонтирует машины' },
  { n: 'Программист', p: '👩‍💻', t: '💻', d: 'пишет программы для компьютера' },
  {
    n: 'Ветеринар',
    p: '🧑‍⚕️',
    t: '🐕',
    d: 'лечит собак, кошек и других зверей',
    g: 'heal',
  },
  { n: 'Портной', p: '👨‍🏭', t: '🧵', d: 'шьёт красивую одежду' },
  { n: 'Капитан', p: '👨‍✈️', t: '⚓', d: 'ведёт большой корабль по морю' },
];

const ROUNDS = 10;
const TOOL_ROUNDS = 5;

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

type Kind = 'tool' | 'riddle';
type Task = { kind: Kind; target: Prof; opts: Prof[] };

function questionText(task: Task): string {
  return task.kind === 'tool'
    ? 'Кому нужен этот предмет?'
    : 'Кто ' + task.target.d + '?';
}

function makeTask(target: Prof, kind: Kind): Task {
  const others = shuffle(
    PROFS.filter(
      (x) =>
        x.n !== target.n && !(kind === 'riddle' && x.g && x.g === target.g),
    ),
  );
  return {
    kind,
    target,
    opts: shuffle([target, others[0], others[1], others[2]]),
  };
}

function makeDeck(): Task[] {
  const targets = shuffle(PROFS).slice(0, ROUNDS);
  const kinds = shuffle(
    targets.map((_, i): Kind => (i < TOOL_ROUNDS ? 'tool' : 'riddle')),
  );
  return targets.map((t, i) => makeTask(t, kinds[i]));
}

export default function ProfessionsGame() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    text: string;
    kind: 'good' | 'bad';
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const timers = useRef<number[]>([]);

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  useEffect(() => {
    syncWallet();
    const deck = makeDeck();
    setTasks(deck);
    speak(questionText(deck[0]));
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
      stopVoice();
    },
    [],
  );

  const task = tasks[round] ?? null;

  function choose(o: Prof) {
    if (locked || !task || finished) return;
    setLocked(true);
    setPicked(o.n);
    const correct = o.n === task.target.n;
    let newScore = score;
    if (correct) {
      sfx(true);
      addCoins(1);
      newScore = score + 1;
      setScore(newScore);
      setToast({ text: 'Верно!', kind: 'good' });
    } else {
      sfx(false);
      setToast({ text: 'Это ' + task.target.n.toLowerCase(), kind: 'bad' });
    }
    const newRound = round + 1;
    later(
      () => {
        if (newRound >= ROUNDS) {
          setRound(newRound);
          finish(newScore);
        } else {
          setLocked(false);
          setPicked(null);
          setToast(null);
          setRound(newRound);
          speak(questionText(tasks[newRound]));
        }
      },
      correct ? 700 : 1150,
    );
  }

  function finish(finalScore: number) {
    setFinished(true);
    const stars =
      finalScore >= 10 ? 3 : finalScore >= 7 ? 2 : finalScore >= 4 ? 1 : 0;
    for (let i = 0; i < stars; i++) {
      later(() => setStarsOn(i + 1), 200 + i * 220);
    }
    if (stars >= 1) burstConfetti();
    saveBest('professions', finalScore);
  }

  function again() {
    const deck = makeDeck();
    setTasks(deck);
    setRound(0);
    setScore(0);
    setLocked(false);
    setPicked(null);
    setToast(null);
    setFinished(false);
    setStarsOn(0);
    speak(questionText(deck[0]));
  }

  const stars = useMemo(
    () => (score >= 10 ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0),
    [score],
  );

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
        <span className="title">Профессии</span>
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

        {!finished && task && (
          <div className="playing board">
            <div className="ask">
              <div className="lead">
                {task.kind === 'tool'
                  ? 'Кому нужен этот предмет?'
                  : 'Угадай профессию'}
              </div>
            </div>

            {task.kind === 'tool' ? (
              <div key={round} className="item pop" aria-hidden="true">
                {task.target.t}
              </div>
            ) : (
              <div key={round} className="riddle pop">
                <span className="mouth" aria-hidden="true">
                  🗣️
                </span>
                <span className="qtext">{questionText(task)}</span>
              </div>
            )}

            <button
              className="say"
              type="button"
              aria-label="Повторить вопрос"
              onClick={() => speak(questionText(task))}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 9h3l5-4v14l-5-4H4z" />
                <path d="M16 9c1.2 1 1.2 5 0 6" />
                <path d="M19 6.5c2.2 2 2.2 9 0 11" />
              </svg>
            </button>

            <div className={'toast' + (toast ? ' ' + toast.kind : '')}>
              {toast?.text ?? ''}
            </div>

            <div className="opts">
              {task.opts.map((o) => (
                <button
                  key={o.n}
                  type="button"
                  disabled={locked}
                  className={
                    'opt' +
                    (locked && o.n === task.target.n ? ' correct' : '') +
                    (locked && picked === o.n && o.n !== task.target.n
                      ? ' wrong'
                      : '')
                  }
                  onClick={() => choose(o)}
                >
                  <span className="face" aria-hidden="true">
                    {o.p}
                  </span>
                  <span className="name">{o.n}</span>
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
                ? 'Идеально!'
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
