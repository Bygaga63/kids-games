import { useEffect, useRef, useState } from 'react';
import { burstConfetti } from '@lib/confetti';
import './puzzle.css';

const CONFETTI_COLORS = [
  '#e64980',
  '#3b6cf6',
  '#12b886',
  '#ffd43b',
  '#ff922b',
  '#9775fa',
];

function idx(r: number, c: number, n: number): number {
  return r * n + c;
}

function solvedState(n: number): number[] {
  const a: number[] = [];
  for (let i = 1; i < n * n; i++) a.push(i);
  a.push(0);
  return a;
}

function neighbors(p: number, n: number): number[] {
  const r = Math.floor(p / n);
  const c = p % n;
  const nb: number[] = [];
  if (r > 0) nb.push(idx(r - 1, c, n));
  if (r < n - 1) nb.push(idx(r + 1, c, n));
  if (c > 0) nb.push(idx(r, c - 1, n));
  if (c < n - 1) nb.push(idx(r, c + 1, n));
  return nb;
}

function scrambled(n: number): { tiles: number[]; blank: number } {
  const tiles = solvedState(n);
  let blank = n * n - 1;
  let last = -1;
  const steps = n * n * 20;
  for (let s = 0; s < steps; s++) {
    const nb = neighbors(blank, n).filter((p) => p !== last);
    const pick = nb[Math.floor(Math.random() * nb.length)];
    last = blank;
    tiles[blank] = tiles[pick];
    tiles[pick] = 0;
    blank = pick;
  }
  // ensure not already solved
  const goal = solvedState(n);
  if (tiles.every((v, i) => v === goal[i])) {
    const p = neighbors(blank, n)[0];
    tiles[blank] = tiles[p];
    tiles[p] = 0;
    blank = p;
  }
  return { tiles, blank };
}

function isSolved(tiles: number[], n: number): boolean {
  const goal = solvedState(n);
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] !== goal[i]) return false;
  }
  return true;
}

export default function PuzzleGame() {
  const [N, setN] = useState(3);
  const [{ tiles, blank }, setField] = useState(() => scrambled(3));
  const [moves, setMoves] = useState(0);
  const [winText, setWinText] = useState('');
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardW, setBoardW] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (boardRef.current) setBoardW(boardRef.current.clientWidth);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  function scramble(n: number) {
    setField(scrambled(n));
    setMoves(0);
    setWinText('');
  }

  function tap(pos: number) {
    const nb = neighbors(pos, N);
    if (nb.indexOf(blank) < 0) return;
    const next = tiles.slice();
    next[blank] = next[pos];
    next[pos] = 0;
    const newMoves = moves + 1;
    setMoves(newMoves);
    setField({ tiles: next, blank: pos });
    checkWin(next, newMoves);
  }

  function checkWin(next: number[], newMoves: number) {
    if (!isSolved(next, N)) return;
    let text = 'Собрано за ' + newMoves + ' ходов!';
    const key = 'iu:moves:puzzle:' + N;
    const prev = parseInt(localStorage.getItem(key) || '0', 10);
    if (!prev || newMoves < prev) {
      localStorage.setItem(key, String(newMoves));
      text = 'Рекорд! ' + newMoves + ' ходов';
    }
    setWinText(text);
    localStorage.setItem('iu:played:puzzle', '1');
    burstConfetti(CONFETTI_COLORS);
  }

  const pad = 10;
  const gap = 8;
  const size = boardW - pad * 2;
  const cell = (size - gap * (N - 1)) / N;
  const fs = Math.max(20, cell * 0.42);
  const solved = isSolved(tiles, N);

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
        <span className="title">Пятнашки</span>
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
          <span>{moves}</span> ходов
        </span>
      </header>

      <main className="stage">
        <div className="row">
          {[3, 4].map((n) => (
            <button
              key={n}
              className="lvl"
              type="button"
              aria-pressed={N === n}
              onClick={() => {
                setN(n);
                scramble(n);
              }}
            >
              {n} × {n}
            </button>
          ))}
          <button className="ghost" type="button" onClick={() => scramble(N)}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 4h4v4M20 4l-6 6M8 20H4v-4M4 20l6-6M16 20h4v-4M14 14l6 6M8 4H4v4M10 10 4 4" />
            </svg>
            Перемешать
          </button>
        </div>
        <div className="hint">
          Двигай костяшки к пустой клетке. Собери числа по порядку.
        </div>
        <div className={'board' + (solved ? ' solved' : '')} ref={boardRef}>
          {boardW > 0 &&
            tiles.map((val, pos) => {
              if (val === 0) return null;
              const r = Math.floor(pos / N);
              const c = pos % N;
              return (
                <button
                  key={val}
                  className="tile"
                  type="button"
                  style={{
                    width: cell + 'px',
                    height: cell + 'px',
                    left: pad + c * (cell + gap) + 'px',
                    top: pad + r * (cell + gap) + 'px',
                    fontSize: fs + 'px',
                  }}
                  onClick={() => tap(pos)}
                >
                  {val}
                </button>
              );
            })}
        </div>
        <div className="win">{winText}</div>
      </main>
    </>
  );
}
