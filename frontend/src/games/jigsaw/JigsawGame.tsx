import { useState } from 'react';
import { shuffle } from '@lib/random';
import { burstConfetti } from '@lib/confetti';
import './jigsaw.css';

const CONFETTI_COLORS = [
  '#e8590c',
  '#3b6cf6',
  '#12b886',
  '#ffd43b',
  '#ff5a7a',
  '#9775fa',
];

// --- картинки (SVG 300x300) ---
const SVG_HOUSE =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'><rect width='300' height='300' fill='#cfe8ff'/><rect y='185' width='300' height='115' fill='#b2f2bb'/><circle cx='248' cy='58' r='34' fill='#ffd43b'/><rect x='92' y='150' width='116' height='95' fill='#ffa94d'/><polygon points='82,150 150,88 218,150' fill='#e8590c'/><rect x='135' y='195' width='32' height='50' fill='#7c4a2d'/><rect x='108' y='165' width='26' height='26' fill='#fff3bf' stroke='#7c4a2d' stroke-width='3'/></svg>";
const SVG_BOAT =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'><rect width='300' height='300' fill='#d0ebff'/><rect y='175' width='300' height='125' fill='#4dabf7'/><circle cx='56' cy='56' r='30' fill='#ffe066'/><rect x='146' y='118' width='7' height='95' fill='#6b4f3a'/><polygon points='155,122 155,208 218,208' fill='#ffffff' stroke='#ced4da' stroke-width='2'/><polygon points='88,210 212,210 192,246 108,246' fill='#e8590c'/></svg>";
const SVG_ROCKET =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'><rect width='300' height='300' fill='#1b1d3a'/><circle cx='60' cy='60' r='3' fill='#fff'/><circle cx='240' cy='80' r='3' fill='#fff'/><circle cx='210' cy='40' r='2' fill='#fff'/><circle cx='90' cy='110' r='2' fill='#fff'/><circle cx='250' cy='200' r='3' fill='#fff'/><polygon points='130,225 150,275 170,225' fill='#ff922b'/><rect x='125' y='110' width='50' height='115' rx='14' fill='#f1f3f5'/><polygon points='125,112 150,58 175,112' fill='#fa5252'/><polygon points='125,185 100,235 125,222' fill='#fa5252'/><polygon points='175,185 200,235 175,222' fill='#fa5252'/><circle cx='150' cy='140' r='16' fill='#4dabf7' stroke='#1b1d3a' stroke-width='3'/></svg>";
const SVG_FLOWER =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'><rect width='300' height='300' fill='#e5dbff'/><rect y='210' width='300' height='90' fill='#b2f2bb'/><rect x='145' y='150' width='10' height='90' fill='#2f9e44'/><ellipse cx='120' cy='200' rx='26' ry='13' fill='#37b24d'/><ellipse cx='180' cy='185' rx='26' ry='13' fill='#37b24d'/><circle cx='150' cy='95' r='26' fill='#ff6b6b'/><circle cx='186' cy='118' r='26' fill='#ff6b6b'/><circle cx='172' cy='158' r='26' fill='#ff6b6b'/><circle cx='128' cy='158' r='26' fill='#ff6b6b'/><circle cx='114' cy='118' r='26' fill='#ff6b6b'/><circle cx='150' cy='128' r='24' fill='#ffd43b'/></svg>";

type Pic = { name: string; svg: string };

const PICS: Pic[] = [
  { name: 'Домик', svg: SVG_HOUSE },
  { name: 'Кораблик', svg: SVG_BOAT },
  { name: 'Ракета', svg: SVG_ROCKET },
  { name: 'Цветок', svg: SVG_FLOWER },
];

function url(svg: string): string {
  return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
}

function makePieces(n: number): number[] {
  const total = n * n;
  let pieces: number[];
  do {
    pieces = shuffle(Array.from({ length: total }, (_, i) => i));
  } while (pieces.every((v, i) => v === i));
  return pieces;
}

export default function JigsawGame() {
  const [N, setN] = useState(3);
  const [picIdx, setPicIdx] = useState(0);
  const [pieces, setPieces] = useState<number[]>(() => makePieces(3));
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [over, setOver] = useState(false);

  function start(n: number) {
    setOver(false);
    setSel(null);
    setMoves(0);
    setPieces(makePieces(n));
  }

  function tap(slot: number) {
    if (over) return;
    if (sel === null) {
      setSel(slot);
      return;
    }
    if (sel === slot) {
      setSel(null);
      return;
    }
    const next = pieces.slice();
    const t = next[sel];
    next[sel] = next[slot];
    next[slot] = t;
    setSel(null);
    setMoves(moves + 1);
    setPieces(next);
    checkWin(next);
  }

  function checkWin(next: number[]) {
    if (!next.every((v, i) => v === i)) return;
    setOver(true);
    localStorage.setItem('iu:played:jigsaw', '1');
    burstConfetti(CONFETTI_COLORS);
  }

  const pic = url(PICS[picIdx].svg);

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
        <span className="title">Собери картинку</span>
        <span className="spacer" />
        <span className="chip">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 7h10v10M17 7 7 17" />
          </svg>
          <span>{moves}</span>
        </span>
      </header>

      <main className="stage">
        <div className="row">
          <div className="seg" role="group" aria-label="Сложность">
            {[3, 4].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={N === n}
                onClick={() => {
                  setN(n);
                  start(n);
                }}
              >
                {n} × {n}
              </button>
            ))}
          </div>
          <div className="thumbs" role="group" aria-label="Картинка">
            {PICS.map((p, i) => (
              <button
                key={p.name}
                type="button"
                className="thumb"
                style={{ backgroundImage: url(p.svg) }}
                aria-pressed={i === picIdx}
                aria-label={p.name}
                onClick={() => {
                  setPicIdx(i);
                  start(N);
                }}
              />
            ))}
          </div>
        </div>

        <div className="goalwrap">
          Цель: <span className="goal" style={{ backgroundImage: pic }} /> меняй
          кусочки местами
        </div>

        <div
          className={'board' + (over ? ' done' : '')}
          style={{ gridTemplateColumns: `repeat(${N},1fr)` }}
        >
          {pieces.map((p, slot) => {
            const px = N > 1 ? ((p % N) / (N - 1)) * 100 : 0;
            const py = N > 1 ? (Math.floor(p / N) / (N - 1)) * 100 : 0;
            return (
              <button
                key={slot}
                type="button"
                className={'tile' + (sel === slot ? ' sel' : '')}
                style={{
                  backgroundImage: pic,
                  backgroundSize: `${N * 100}% ${N * 100}%`,
                  backgroundPosition: `${px}% ${py}%`,
                }}
                onClick={() => tap(slot)}
              />
            );
          })}
        </div>

        <div className={'status' + (over ? ' win' : '')}>
          {over ? `Готово! Картинка собрана за ${moves} ходов` : ''}
        </div>

        <div className="row">
          <button className="btn" type="button" onClick={() => start(N)}>
            Перемешать
          </button>
        </div>
      </main>
    </>
  );
}
