import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './clock.css';

const CONFETTI_COLORS = [
  '#d6336c',
  '#3b6cf6',
  '#e8590c',
  '#12b886',
  '#ffd43b',
  '#9775fa',
];

type Target = { h: number; m: number };

// --- разметка циферблата (статичная) ---
type Tick = { x1: string; y1: string; x2: string; y2: string; big: boolean };
const TICKS: Tick[] = (() => {
  const out: Tick[] = [];
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 * Math.PI) / 180;
    const big = i % 5 === 0;
    const r1 = big ? 80 : 84;
    const r2 = 92;
    out.push({
      x1: (100 + Math.sin(a) * r1).toFixed(1),
      y1: (100 - Math.cos(a) * r1).toFixed(1),
      x2: (100 + Math.sin(a) * r2).toFixed(1),
      y2: (100 - Math.cos(a) * r2).toFixed(1),
      big,
    });
  }
  return out;
})();

type Num = { x: string; y: string; h: number };
const NUMS: Num[] = (() => {
  const out: Num[] = [];
  for (let h = 1; h <= 12; h++) {
    const a2 = (h * 30 * Math.PI) / 180;
    const r = 60;
    out.push({
      x: (100 + Math.sin(a2) * r).toFixed(1),
      y: (100 - Math.cos(a2) * r).toFixed(1),
      h,
    });
  }
  return out;
})();

function inWords(h: number, m: number): string {
  if (m === 0) return 'Ровно ' + h + ' ' + plural(h, 'час', 'часа', 'часов');
  if (m === 15)
    return h + ' ' + plural(h, 'час', 'часа', 'часов') + ' 15 минут (четверть)';
  if (m === 30) return 'Половина ' + (h === 12 ? 1 : h + 1) + '-го';
  if (m === 45) return 'Без пятнадцати ' + (h === 12 ? 1 : h + 1);
  return (
    h +
    ' ' +
    plural(h, 'час', 'часа', 'часов') +
    ' ' +
    m +
    ' ' +
    plural(m, 'минута', 'минуты', 'минут')
  );
}
function plural(n: number, one: string, few: string, many: string): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
  return many;
}

// --- задания: сложность растёт сама со счётом ---
// 0–2 верных: только целые часы; 3–5: + половинки; 6–8: + четверти; дальше — любые 5 минут
function minutesPool(score: number): number[] {
  if (score < 3) return [0];
  if (score < 6) return [0, 30];
  if (score < 9) return [0, 15, 30, 45];
  const all: number[] = [];
  for (let m = 0; m < 60; m += 5) all.push(m);
  return all;
}
function levelOf(score: number): number {
  return score < 3 ? 0 : score < 6 ? 1 : score < 9 ? 2 : 3;
}
const LEVEL_UP = [
  '',
  'Усложняем: теперь и половинки часов!',
  'Ещё сложнее: четверти часа!',
  'Максимум: любые минуты!',
];

const pad2 = (m: number) => (m < 10 ? '0' + m : String(m));

export default function ClockGame() {
  const [hours, setHours] = useState(3); // независимые стрелки; старт 3:00
  const [minutes, setMinutes] = useState(0);
  const [target, setTarget] = useState<Target>({ h: 3, m: 0 });
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<{
    text: string;
    kind: 'good' | 'bad';
  } | null>(null);
  const [dragClass, setDragClass] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const draggingRef = useRef<'m' | 'h' | null>(null);
  const targetRef = useRef<Target>({ h: 3, m: 0 });
  const levelRef = useRef(0);

  useEffect(() => {
    syncWallet();
    newTask(0);
  }, []);

  useEffect(() => {
    const drop = () => {
      draggingRef.current = null;
      setDragClass(false);
    };
    window.addEventListener('pointerup', drop);
    return () => window.removeEventListener('pointerup', drop);
  }, []);

  // --- координаты указателя в системе svg ---
  function pointAngle(e: { clientX: number; clientY: number }) {
    const r = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 200 - 100;
    const y = ((e.clientY - r.top) / r.height) * 200 - 100;
    const deg = ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
    const rad = Math.sqrt(x * x + y * y) / 94;
    return { deg, r: rad };
  }

  function grab(e: React.PointerEvent<SVGSVGElement>) {
    const p = pointAngle(e);
    draggingRef.current = p.r > 0.52 ? 'm' : 'h';
    setDragClass(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    move(e);
  }
  function move(e: React.PointerEvent<SVGSVGElement>) {
    if (!draggingRef.current) return;
    e.preventDefault();
    const deg = pointAngle(e).deg;
    if (draggingRef.current === 'm') {
      setMinutes(Math.round(deg / 6) % 60); // минутная — независимо
    } else {
      setHours(Math.round(deg / 30) % 12); // часовая — независимо, ставится по часам
    }
  }
  function drop() {
    draggingRef.current = null;
    setDragClass(false);
  }

  function newTask(s: number) {
    const ms = minutesPool(s);
    let th = 0;
    let tm = 0;
    let tries = 0;
    do {
      th = Math.floor(Math.random() * 12) + 1;
      tm = ms[Math.floor(Math.random() * ms.length)];
      tries++;
    } while (
      tries < 50 &&
      th === targetRef.current.h &&
      tm === targetRef.current.m
    ); // новое задание всегда отличается от прежнего
    targetRef.current = { h: th, m: tm };
    setTarget({ h: th, m: tm });
    const lv = levelOf(s);
    if (lv > levelRef.current) {
      levelRef.current = lv;
      setStatus({ text: LEVEL_UP[lv], kind: 'good' });
    } else {
      setStatus(null);
    }
  }

  function check() {
    const curH = hours % 12 === 0 ? 12 : hours % 12;
    if (curH === target.h && minutes === target.m) {
      const newScore = score + 1;
      setScore(newScore);
      setStatus({ text: 'Верно!', kind: 'good' });
      burstConfetti(CONFETTI_COLORS, 60);
      addCoins(1);
      saveBest('clock', newScore);
      setTimeout(() => newTask(newScore), 800); // сразу новое случайное задание
    } else {
      setStatus({
        text: 'Пока не так. Нужно ' + target.h + ':' + pad2(target.m),
        kind: 'bad',
      });
    }
  }

  const mAng = minutes * 6;
  const hAng = (hours % 12) * 30;
  const mr = 64;
  const hr = 44;
  const knobM = {
    cx: (100 + Math.sin((mAng * Math.PI) / 180) * mr).toFixed(1),
    cy: (100 - Math.cos((mAng * Math.PI) / 180) * mr).toFixed(1),
  };
  const knobH = {
    cx: (100 + Math.sin((hAng * Math.PI) / 180) * hr).toFixed(1),
    cy: (100 - Math.cos((hAng * Math.PI) / 180) * hr).toFixed(1),
  };
  const hh = hours % 12 === 0 ? 12 : hours % 12;

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
        <span className="title">Учим время</span>
        <span className="spacer" />
        <span className="score">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
          </svg>
          <span>{score}</span>
        </span>
      </header>

      <main className="stage">
        <div className="digital">
          {hh}
          <span className="colon">:</span>
          {pad2(minutes)}
        </div>
        <div className="words">{inWords(hh, minutes)}</div>
        <div className="task">
          Поставь время:{' '}
          <b>
            {target.h}:{pad2(target.m)}
          </b>
        </div>

        <div className="clockwrap">
          <svg
            ref={svgRef}
            className={'clock' + (dragClass ? ' drag' : '')}
            viewBox="0 0 200 200"
            aria-label="Часы, крути стрелки"
            onPointerDown={grab}
            onPointerMove={move}
            onPointerCancel={drop}
          >
            <circle className="face" cx="100" cy="100" r="94" />
            <g>
              {TICKS.map((t, i) => (
                <line
                  key={i}
                  className={'tick' + (t.big ? ' big' : '')}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                />
              ))}
            </g>
            <g>
              {NUMS.map((n) => (
                <text key={n.h} className="num" x={n.x} y={n.y} fontSize="15">
                  {n.h}
                </text>
              ))}
            </g>
            <line
              className="hand-h"
              x1="100"
              y1="100"
              x2="100"
              y2="52"
              transform={`rotate(${hAng} 100 100)`}
            />
            <line
              className="hand-m"
              x1="100"
              y1="100"
              x2="100"
              y2="30"
              transform={`rotate(${mAng} 100 100)`}
            />
            <circle className="cap" cx="100" cy="100" r="7" />
            <circle className="cap2" cx="100" cy="100" r="2.6" />
            <circle className="knob-h" r="9" cx={knobH.cx} cy={knobH.cy} />
            <circle className="knob-m" r="9" cx={knobM.cx} cy={knobM.cy} />
          </svg>
        </div>

        <div className="legend">
          <span>
            <i className="h" /> часовая (короткая)
          </span>
          <span>
            <i className="m" /> минутная (длинная)
          </span>
        </div>

        <div className={'status' + (status ? ' ' + status.kind : '')}>
          {status?.text ?? ''}
        </div>
        <div className="row">
          <button className="btn" type="button" onClick={check}>
            Проверить
          </button>
        </div>
      </main>
    </>
  );
}
