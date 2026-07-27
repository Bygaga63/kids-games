import { useEffect, useRef, useState, type ReactNode } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './pattern.css';

// Кубик Никитина: 4 сплошные грани (красная, белая, синяя, жёлтая)
// и 2 диагональные — красно-белая и жёлто-синяя, с 4 поворотами уголка.
type SolidColor = 'r' | 'w' | 'b' | 'y';
type PairKey = 'rw' | 'yb';
type Cell =
  | { t: 's'; c: SolidColor } // сплошная
  | { t: 'd'; p: PairKey; rot: number }; // уголок, rot 0..3

const COL: Record<SolidColor, string> = {
  r: '#f03e3e',
  w: '#ffffff',
  b: '#339af0',
  y: '#ffd43b',
};
const PAIRS: Record<PairKey, [SolidColor, SolidColor]> = {
  rw: ['r', 'w'],
  yb: ['y', 'b'],
};
const CONFETTI_COLORS = [
  '#f03e3e',
  '#339af0',
  '#ffd43b',
  '#51cf66',
  '#ff5a7a',
  '#7048e8',
];

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

const LEAD_DEFAULT = 'Выбери кубик внизу и выложи узор как на образце';

function bg(cell: Cell): string {
  if (cell.t === 's') return COL[cell.c];
  const pr = PAIRS[cell.p];
  return (
    'linear-gradient(' +
    (45 + 90 * cell.rot) +
    'deg, ' +
    COL[pr[0]] +
    ' 50%, ' +
    COL[pr[1]] +
    ' 50%)'
  );
}

function same(a: Cell, b: Cell): boolean {
  if (a.t !== b.t) return false;
  if (a.t === 's' && b.t === 's') return a.c === b.c;
  if (a.t === 'd' && b.t === 'd') return a.p === b.p && a.rot === b.rot;
  return false;
}

// зеркальный поворот уголка при отражении по горизонтали: 45↔315, 135↔225
function mirrorRot(rot: number): number {
  return [3, 2, 1, 0][rot];
}

function modeSet(n: number): { solids: SolidColor[]; pairs: PairKey[] } {
  // на 2×2 — классическая красно-белая серия
  return n === 2
    ? { solids: ['r', 'w'], pairs: ['rw'] }
    : { solids: ['r', 'w', 'b', 'y'], pairs: ['rw', 'yb'] };
}

function genPattern(n: number): Cell[][] {
  const m = modeSet(n);
  const half = Math.ceil(n / 2);
  const g: Cell[][] = [];
  for (let r = 0; r < n; r++) {
    g.push([]);
    for (let c = 0; c < n; c++) g[r].push({ t: 's', c: 'w' });
  }
  for (let r2 = 0; r2 < n; r2++) {
    for (let c2 = 0; c2 < half; c2++) {
      let cell: Cell;
      if (Math.random() < 0.55) {
        const p = m.pairs[Math.floor(Math.random() * m.pairs.length)];
        cell = { t: 'd', p, rot: Math.floor(Math.random() * 4) };
      } else {
        cell = {
          t: 's',
          c: m.solids[Math.floor(Math.random() * m.solids.length)],
        };
      }
      g[r2][c2] = cell;
      g[r2][n - 1 - c2] =
        cell.t === 's'
          ? { t: 's', c: cell.c }
          : { t: 'd', p: cell.p, rot: mirrorRot(cell.rot) };
    }
  }
  // валидность: есть уголки и не всё белое
  let diags = 0;
  let colored = 0;
  g.forEach((row) =>
    row.forEach((v) => {
      if (v.t === 'd') diags++;
      if (!(v.t === 's' && v.c === 'w')) colored++;
    }),
  );
  if (diags < 2 || colored < n) return genPattern(n);
  return g;
}

function whiteGrid(n: number): Cell[][] {
  const g: Cell[][] = [];
  for (let r = 0; r < n; r++) {
    g.push([]);
    for (let c = 0; c < n; c++) g[r].push({ t: 's', c: 'w' });
  }
  return g;
}

function paletteTiles(n: number): Cell[] {
  const m = modeSet(n);
  const tiles: Cell[] = [];
  m.solids.forEach((c) => tiles.push({ t: 's', c }));
  m.pairs.forEach((p) => tiles.push({ t: 'd', p, rot: 0 }));
  return tiles;
}

export default function PatternGame() {
  const [n, setN] = useState(2);
  const [target, setTarget] = useState<Cell[][]>([]);
  const [work, setWork] = useState<Cell[][]>([]);
  const [selIdx, setSelIdx] = useState(0);
  const [locked, setLocked] = useState(false);
  const [solved, setSolved] = useState(0);
  const [win, setWin] = useState(false);
  const [lead, setLead] = useState<ReactNode>(LEAD_DEFAULT);
  const [miss, setMiss] = useState<Record<number, number>>({}); // тик для перезапуска blink-анимации

  const roundTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    syncWallet();
    newRound(2);
    return () => {
      if (roundTimer.current) clearTimeout(roundTimer.current);
    };
  }, []);

  const tiles = paletteTiles(n);

  function newRound(size: number) {
    setLocked(false);
    setTarget(genPattern(size));
    setWork(whiteGrid(size));
    setWin(false);
    setMiss({});
    setSelIdx(0);
    setLead(LEAD_DEFAULT);
  }

  function equal(w: Cell[][], t: Cell[][], size: number): boolean {
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) if (!same(w[r][c], t[r][c])) return false;
    return true;
  }

  function paint(r: number, c: number) {
    if (locked) return;
    const sel = tiles[selIdx];
    if (!sel) return;
    const w = work.map((row) => row.slice());
    const cur = w[r][c];
    if (sel.t === 'd' && cur.t === 'd' && cur.p === sel.p) {
      w[r][c] = { t: 'd', p: cur.p, rot: (cur.rot + 1) % 4 }; // повторное нажатие — поворот уголка
    } else if (sel.t === 's') {
      w[r][c] = { t: 's', c: sel.c };
    } else {
      w[r][c] = { t: 'd', p: sel.p, rot: 0 };
    }
    setWork(w);
    checkWin(w);
  }

  function checkWin(w: Cell[][]) {
    if (!equal(w, target, n)) return;
    setLocked(true);
    const ns = solved + 1;
    setSolved(ns);
    addCoins(1);
    saveBest('pattern', ns);
    setWin(true);
    setLead(
      <>
        <b>Узор собран!</b> Сейчас будет новый…
      </>,
    );
    burstConfetti(CONFETTI_COLORS, 60);
    roundTimer.current = setTimeout(() => newRound(n), 1500);
  }

  function hint() {
    if (locked) return;
    let bad = 0;
    setMiss((m) => {
      const next = { ...m };
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (!same(work[r][c], target[r][c])) {
            const idx = r * n + c;
            next[idx] = (next[idx] || 0) + 1;
            bad++;
          }
        }
      }
      return next;
    });
    // считаем несовпадения синхронно для текста
    bad = 0;
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) if (!same(work[r][c], target[r][c])) bad++;
    setLead(
      bad
        ? 'Мигают клетки, где пока не так, как в образце'
        : 'Всё верно — почти собрано!',
    );
  }

  function pickSize(size: number) {
    setN(size);
    newRound(size);
  }

  const gridCols = { gridTemplateColumns: `repeat(${n},1fr)` };

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
        <span className="title">Сложи узор · кубики Никитина</span>
        <span className="spacer" />
        <span className="score">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
            {STAR}
          </svg>
          <span>{solved}</span>
        </span>
      </header>

      <main className="stage">
        <div className="seg" role="group" aria-label="Размер поля">
          <button
            type="button"
            aria-pressed={n === 2}
            onClick={() => pickSize(2)}
          >
            2×2 · для начала
          </button>
          <button
            type="button"
            aria-pressed={n === 3}
            onClick={() => pickSize(3)}
          >
            3×3
          </button>
          <button
            type="button"
            aria-pressed={n === 4}
            onClick={() => pickSize(4)}
          >
            4×4
          </button>
        </div>

        <div className="lead">{lead}</div>

        <div className="boards">
          <div className="board">
            <span className="cap">ОБРАЗЕЦ</span>
            <div className="grid small" style={gridCols}>
              {target.flatMap((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={r * n + c}
                    className="cell"
                    style={{ background: bg(cell) }}
                  />
                )),
              )}
            </div>
          </div>
          <div className="board">
            <span className="cap">ТВОЁ ПОЛЕ</span>
            <div className={'grid big' + (win ? ' win' : '')} style={gridCols}>
              {work.flatMap((row, r) =>
                row.map((cell, c) => {
                  const idx = r * n + c;
                  const tick = miss[idx] || 0;
                  return (
                    <div
                      key={`${idx}-${tick}`}
                      className={'cell' + (tick ? ' miss' : '')}
                      style={{ background: bg(cell) }}
                      onPointerDown={() => paint(r, c)}
                    />
                  );
                }),
              )}
            </div>
          </div>
        </div>

        <div className="palette">
          {tiles.map((tile, i) => (
            <button
              key={i}
              className="sw"
              type="button"
              style={{
                background: bg(tile),
                ...(tile.t === 's' && tile.c === 'w'
                  ? { borderColor: '#dfe6ef' }
                  : null),
              }}
              aria-label={tile.t === 's' ? 'Сплошной кубик' : 'Кубик с уголком'}
              aria-pressed={i === selIdx}
              onClick={() => setSelIdx(i)}
            />
          ))}
        </div>
        <div className="hintline">
          Кубик с уголком: нажимай на клетку ещё раз — уголок повернётся
        </div>

        <div className="row">
          <button className="btn ghost" type="button" onClick={hint}>
            Проверить
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => {
              if (!locked) newRound(n);
            }}
          >
            Новый узор
          </button>
        </div>
      </main>
    </>
  );
}
