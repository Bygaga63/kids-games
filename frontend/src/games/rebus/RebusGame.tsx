import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './rebus.css';

// Ребус: parts — что показать; ans — ответ; expl — разбор
// part: {pic:'🐱'} | {chip:'+ ЛЕТА'} | {chip:'У', cross:true}
type Part = { pic?: string; chip?: string; cross?: boolean };
type Rebus = { parts: Part[]; ans: string; expl: string };

const DATA: Rebus[] = [
  {
    parts: [{ pic: '🏠' }, { chip: '+ ИК' }],
    ans: 'ДОМИК',
    expl: 'ДОМ + ИК = домик.',
  },
  {
    parts: [{ pic: '🐟' }, { chip: '+ К' }],
    ans: 'РЫБАК',
    expl: 'РЫБА + К = рыбак.',
  },
  {
    parts: [{ pic: '👃' }, { chip: '+ ОК' }],
    ans: 'НОСОК',
    expl: 'НОС + ОК = носок.',
  },
  {
    parts: [{ pic: '🦞' }, { chip: '+ ЕТА' }],
    ans: 'РАКЕТА',
    expl: 'РАК + ЕТА = ракета!',
  },
  {
    parts: [{ pic: '🐱' }, { chip: '+ ЛЕТА' }],
    ans: 'КОТЛЕТА',
    expl: 'КОТ + ЛЕТА = котлета!',
  },
  {
    parts: [{ pic: '💯' }, { chip: '+ Л' }],
    ans: 'СТОЛ',
    expl: 'Число СТО + Л = стол.',
  },
  {
    parts: [{ chip: 'Г +' }, { pic: '🌹' }],
    ans: 'ГРОЗА',
    expl: 'Г + РОЗА = гроза.',
  },
  {
    parts: [{ chip: 'Х +' }, { pic: '🦁' }],
    ans: 'ХЛЕВ',
    expl: 'Х + ЛЕВ = хлев. Это домик для коровы и овечек.',
  },
  {
    parts: [{ pic: '🦷' }, { chip: '+ Р' }],
    ans: 'ЗУБР',
    expl: 'ЗУБ + Р = зубр, большой лесной бык.',
  },
  {
    parts: [{ pic: '🎈' }, { chip: '+ Ф' }],
    ans: 'ШАРФ',
    expl: 'ШАР + Ф = шарф.',
  },
  {
    parts: [{ pic: '🌂' }, { chip: '+ ИК' }],
    ans: 'ЗОНТИК',
    expl: 'ЗОНТ + ИК = зонтик.',
  },
  {
    parts: [{ pic: '🐱' }, { chip: 'О → И' }],
    ans: 'КИТ',
    expl: 'В слове КОТ заменили О на И — получился КИТ!',
  },
  {
    parts: [{ pic: '🐳' }, { chip: 'И → О' }],
    ans: 'КОТ',
    expl: 'В слове КИТ заменили И на О — получился КОТ!',
  },
  {
    parts: [{ pic: '🎣' }, { chip: 'У', cross: true }],
    ans: 'ДОЧКА',
    expl: 'УДОЧКА без буквы У — дочка!',
  },
];
const EXTRA = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ';
const ROUNDS = 10;
const CONFETTI_COLORS = [
  '#e8590c',
  '#ffa94d',
  '#12b886',
  '#ffd43b',
  '#3b6cf6',
  '#ff5a7a',
];

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

type Toast = { b: string; rest: string; kind: 'good' | 'bad' };

export default function RebusGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [barPct, setBarPct] = useState(0);
  const [locked, setLocked] = useState(false);
  const [current, setCurrent] = useState<Rebus | null>(null);
  const [bank, setBank] = useState<string[]>([]);
  const [typed, setTyped] = useState('');
  const [slotsCls, setSlotsCls] = useState<'' | 'ok' | 'no'>('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [showNext, setShowNext] = useState(false);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [rebusKey, setRebusKey] = useState(0); // перезапуск pop-анимации

  const queue = useRef<Rebus[]>([]);
  const mistakes = useRef(0);
  const lockedRef = useRef(false);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    syncWallet();
    next(0);
    return () => {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
    };
  }, []);

  function next(r: number) {
    lockedRef.current = false;
    setLocked(false);
    mistakes.current = 0;
    setTyped('');
    setShowNext(false);
    setToast(null);
    setSlotsCls('');
    if (queue.current.length === 0) queue.current = shuffle(DATA);
    const cur = queue.current.shift()!;
    setCurrent(cur);
    // буквы ответа + 3 лишние
    let letters = cur.ans.split('');
    const pool = EXTRA.split('').filter((ch) => letters.indexOf(ch) < 0);
    letters = letters.concat(shuffle(pool).slice(0, 3));
    setBank(shuffle(letters));
    setRebusKey((k) => k + 1);
    setBarPct((r / ROUNDS) * 100);
  }

  function press(ch: string) {
    if (lockedRef.current || !current || typed.length >= current.ans.length)
      return;
    const t = typed + ch;
    setTyped(t);
    if (t.length === current.ans.length) check(t);
  }

  function erase() {
    if (lockedRef.current || !typed) return;
    setTyped((t) => t.slice(0, -1));
    setSlotsCls('');
  }

  function check(t: string) {
    if (!current) return;
    if (t === current.ans) {
      lockedRef.current = true;
      setLocked(true);
      setSlotsCls('ok');
      addCoins(1);
      if (mistakes.current === 0) setScore((s) => s + 1);
      setToast({
        b: 'Верно, ' + current.ans + '!',
        rest: ' ' + current.expl,
        kind: 'good',
      });
      burstConfetti(CONFETTI_COLORS, 60);
      setRound((r) => r + 1);
      setShowNext(true);
    } else {
      mistakes.current++;
      setSlotsCls('no');
      setToast({
        b: 'Не совсем.',
        rest: ' Сотри и попробуй ещё раз!',
        kind: 'bad',
      });
      wrongTimer.current = setTimeout(() => {
        if (!lockedRef.current) {
          setTyped('');
          setSlotsCls('');
        }
      }, 700);
    }
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
    if (stars >= 1) burstConfetti(CONFETTI_COLORS, 60);
    saveBest('rebus', score);
  }

  function again() {
    setRound(0);
    setScore(0);
    queue.current = [];
    setFinished(false);
    setStarsOn(0);
    next(0);
  }

  // блокируем использованные буквы (по количеству)
  const used: Record<string, number> = {};
  typed.split('').forEach((ch) => {
    used[ch] = (used[ch] || 0) + 1;
  });

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
        <span className="title">Ребусы</span>
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
              width: '100%',
            }}
          >
            <div className="lead">Разгадай ребус и собери слово из букв</div>
            <div key={rebusKey} className="rebus pop">
              {current.parts.map((p, i) =>
                p.pic ? (
                  <span key={i} className="pic">
                    {p.pic}
                  </span>
                ) : (
                  <span key={i} className={'chip' + (p.cross ? ' cross' : '')}>
                    {p.chip}
                  </span>
                ),
              )}
              <span className="eq">= ?</span>
            </div>
            <div className={'slots' + (slotsCls ? ' ' + slotsCls : '')}>
              {current.ans.split('').map((_, i) => (
                <div
                  key={i}
                  className={'slot' + (i < typed.length ? ' filled' : '')}
                >
                  {typed[i] || ''}
                </div>
              ))}
            </div>
            <div className="bank">
              {bank.map((ch, i) => {
                let disabled = locked;
                if ((used[ch] || 0) > 0) {
                  used[ch]--;
                  disabled = true;
                }
                return (
                  <button
                    key={i}
                    className="key"
                    type="button"
                    disabled={disabled}
                    onClick={() => press(ch)}
                  >
                    {ch}
                  </button>
                );
              })}
              <button
                className="key fn"
                type="button"
                aria-label="Стереть"
                onClick={erase}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 6H8l-5 6 5 6h13a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z" />
                  <path d="M12 9l6 6M18 9l-6 6" />
                </svg>
              </button>
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
                  {round >= ROUNDS ? 'Смотреть результат' : 'Следующий ребус'}
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
                >
                  {STAR}
                </svg>
              ))}
            </div>
            <div className="big">
              {stars === 3
                ? 'Мастер ребусов!'
                : stars >= 1
                  ? 'Молодец!'
                  : 'Попробуй ещё!'}
            </div>
            <div className="res">
              С первой попытки: {score} из {ROUNDS}
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
