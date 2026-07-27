import { useEffect, useReducer, useRef, useState } from 'react';
import { burstConfetti } from '@lib/confetti';
import './xo.css';

const CONFETTI_COLORS = [
  '#1098ad',
  '#3b6cf6',
  '#f76707',
  '#ffd43b',
  '#12b886',
  '#ff5a7a',
];

type Player = 'X' | 'O';
type Mode = 'cpu' | 'duo';
type WinRes = { player: string; cells: number[] };

const HUMAN: Player = 'X';
const AI: Player = 'O';

function MarkX({ stroke }: { stroke: string }) {
  return (
    <svg
      className="mk"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="3"
      strokeLinecap="round"
    >
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function MarkO({ stroke }: { stroke: string }) {
  return (
    <svg
      className="mk"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="3"
    >
      <circle cx="12" cy="12" r="7" />
    </svg>
  );
}

function markSpan(p: string) {
  return p === 'X' ? <MarkX stroke="var(--x)" /> : <MarkO stroke="var(--o)" />;
}

type Game = {
  N: number;
  need: number;
  mode: Mode;
  board: string[];
  turn: Player;
  over: boolean;
  lock: boolean;
  winCells: number[] | null;
  result: { draw: true } | { player: string } | null;
  allLines: number[][] | null;
};

export default function XoGame() {
  const g = useRef<Game>({
    N: 3,
    need: 3,
    mode: 'cpu',
    board: new Array(9).fill(''),
    turn: 'X',
    over: false,
    lock: false,
    winCells: null,
    result: null,
    allLines: null,
  });
  const [scoreX, setScoreX] = useState(0);
  const [scoreO, setScoreO] = useState(0);
  const [, force] = useReducer((x: number) => x + 1, 0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);

  function reset() {
    const s = g.current;
    s.board = new Array(s.N * s.N).fill('');
    s.turn = 'X';
    s.over = false;
    s.lock = false;
    s.winCells = null;
    s.result = null;
    force();
  }

  function lines(): number[][] {
    const s = g.current;
    const L: number[][] = [];
    const dirs = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];
    for (let r = 0; r < s.N; r++)
      for (let col = 0; col < s.N; col++) {
        dirs.forEach((d) => {
          let cells: number[] | null = [];
          for (let k = 0; k < s.need; k++) {
            const rr = r + d[0] * k;
            const cc = col + d[1] * k;
            if (rr < 0 || rr >= s.N || cc < 0 || cc >= s.N) {
              cells = null;
              break;
            }
            cells.push(rr * s.N + cc);
          }
          if (cells) L.push(cells);
        });
      }
    return L;
  }

  function checkWin(): WinRes | null {
    const s = g.current;
    if (!s.allLines) s.allLines = lines();
    for (let i = 0; i < s.allLines.length; i++) {
      const c = s.allLines[i];
      const first = s.board[c[0]];
      if (!first) continue;
      let win = true;
      for (let k = 1; k < c.length; k++) {
        if (s.board[c[k]] !== first) {
          win = false;
          break;
        }
      }
      if (win) return { player: first, cells: c };
    }
    return null;
  }

  function findWin(p: string): number {
    const s = g.current;
    for (let i = 0; i < s.board.length; i++) {
      if (s.board[i]) continue;
      s.board[i] = p;
      const w = checkWin();
      s.board[i] = '';
      if (w && w.player === p) return i;
    }
    return -1;
  }

  function aiPick(): number {
    const s = g.current;
    const w = findWin(AI);
    if (w >= 0) return w;
    const blk = findWin(HUMAN);
    if (blk >= 0) return blk;
    // positional: prefer center & adjacency to existing marks
    const center = (s.N - 1) / 2;
    let best = -1;
    let bestScore = -1e9;
    let ties: number[] = [];
    for (let i = 0; i < s.board.length; i++) {
      if (s.board[i]) continue;
      const r = Math.floor(i / s.N);
      const col = i % s.N;
      const dc = Math.abs(r - center) + Math.abs(col - center);
      let score = -dc * 1.5;
      for (let dr = -1; dr <= 1; dr++)
        for (let dcc = -1; dcc <= 1; dcc++) {
          if (!dr && !dcc) continue;
          const rr = r + dr;
          const cc = col + dcc;
          if (rr < 0 || rr >= s.N || cc < 0 || cc >= s.N) continue;
          const v = s.board[rr * s.N + cc];
          if (v === AI) score += 2.2;
          else if (v === HUMAN) score += 1.1;
        }
      if (score > bestScore) {
        bestScore = score;
        ties = [i];
        best = i;
      } else if (score === bestScore) {
        ties.push(i);
      }
    }
    if (ties.length) return ties[Math.floor(Math.random() * ties.length)];
    return best;
  }

  function click(i: number) {
    const s = g.current;
    if (s.over || s.lock || s.board[i]) return;
    if (s.mode === 'cpu' && s.turn !== HUMAN) return;
    place(i);
  }

  function place(i: number) {
    const s = g.current;
    s.board[i] = s.turn;
    const res = checkWin();
    if (res) {
      end(res);
      return;
    }
    if (s.board.every((v) => v)) {
      end({ draw: true });
      return;
    }
    s.turn = s.turn === 'X' ? 'O' : 'X';
    force();
    if (s.mode === 'cpu' && s.turn === AI && !s.over) {
      s.lock = true;
      timer.current = window.setTimeout(() => {
        s.lock = false;
        if (s.over || s.mode !== 'cpu' || s.turn !== AI) return;
        const m = aiPick();
        if (m >= 0) place(m);
      }, 420);
    }
  }

  function end(res: WinRes | { draw: true }) {
    const s = g.current;
    s.over = true;
    if ('draw' in res) {
      s.result = { draw: true };
      force();
      return;
    }
    s.winCells = res.cells;
    s.result = { player: res.player };
    if (res.player === 'X') setScoreX((v) => v + 1);
    else setScoreO((v) => v + 1);
    force();
    burstConfetti(CONFETTI_COLORS);
  }

  function setSize(n: number) {
    const s = g.current;
    s.N = n;
    s.need = n === 3 ? 3 : 4;
    s.allLines = null;
    reset();
  }

  function setMode(m: Mode) {
    g.current.mode = m;
    reset();
  }

  const s = g.current;
  const result = s.result;

  let statusClass = 'status turn';
  let statusContent: React.ReactNode;
  if (result && 'draw' in result) {
    statusClass = 'status draw';
    statusContent = 'Ничья! Сыграем ещё?';
  } else if (result) {
    statusClass = 'status ' + result.player.toLowerCase();
    const who =
      s.mode === 'cpu'
        ? result.player === HUMAN
          ? 'Ты выиграл! '
          : 'Победил компьютер '
        : 'Победил игрок ';
    statusContent = (
      <>
        {who}
        {markSpan(result.player)}
      </>
    );
  } else if (s.mode === 'cpu') {
    statusContent = (
      <>
        {s.turn === HUMAN ? 'Твой ход ' : 'Ход компьютера '}
        {markSpan(s.turn)}
      </>
    );
  } else {
    statusContent = (
      <>
        {'Ход игрока '}
        {markSpan(s.turn)}
      </>
    );
  }

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
        <span className="title">Крестики-нолики</span>
        <span className="spacer" />
        <span className="scoreboard">
          <span className="x">
            ✗ <span>{scoreX}</span>
          </span>
          <span className="sep">:</span>
          <span className="o">
            <span>{scoreO}</span> ◯
          </span>
        </span>
      </header>

      <main className="stage">
        <div className="row">
          <div className="seg" role="group" aria-label="Размер поля">
            {[3, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={s.N === n}
                onClick={() => setSize(n)}
              >
                {n} × {n}
              </button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Режим игры">
            <button
              type="button"
              aria-pressed={s.mode === 'cpu'}
              onClick={() => setMode('cpu')}
            >
              С компьютером
            </button>
            <button
              type="button"
              aria-pressed={s.mode === 'duo'}
              onClick={() => setMode('duo')}
            >
              Вдвоём
            </button>
          </div>
        </div>

        <div className={statusClass}>{statusContent}</div>

        <div
          className={'board' + (s.N >= 10 ? ' big' : '')}
          style={{
            gridTemplateColumns: `repeat(${s.N},1fr)`,
            gap: s.N >= 10 ? '4px' : 'clamp(6px,1.6vw,10px)',
          }}
        >
          {s.board.map((v, i) => (
            <button
              key={i}
              type="button"
              className={
                'cell' +
                (v ? ' ' + v.toLowerCase() : '') +
                (s.winCells && s.winCells.indexOf(i) >= 0 ? ' win' : '')
              }
              onClick={() => click(i)}
            >
              {v === 'X' && <MarkX stroke="currentColor" />}
              {v === 'O' && <MarkO stroke="currentColor" />}
            </button>
          ))}
        </div>

        <div className="row">
          <button className="btn" type="button" onClick={reset}>
            Новая игра
          </button>
          <button
            className="ghost"
            type="button"
            onClick={() => {
              setScoreX(0);
              setScoreO(0);
              reset();
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 4v4h4" />
            </svg>
            Сбросить счёт
          </button>
        </div>
      </main>
    </>
  );
}
