import { useEffect, useRef, useState } from 'react';
import { loadWallet, saveWallet, coinBalance, syncWallet } from '@lib/wallet';
import type { Wallet } from '@lib/wallet';
import { burstConfetti } from '@lib/confetti';
import './pet-shop.css';

type Breed = { k: string; e: string; n: string };
type Pet = { k: string; e: string; n: string; price: number; breeds?: Breed[] };
type Good = { k: string; e: string; n: string; price: number };
type CardInfo = { e: string; n: string };
type Tab = 'pets' | 'food' | 'things';

// --- каталог: питомцы с телами; у некоторых — породы ---
const PETS: Pet[] = [
  { k: 'snail', e: '🐌', n: 'Улитка', price: 10 },
  { k: 'mouse', e: '🐁', n: 'Мышка', price: 15 },
  { k: 'hamster', e: '🐹', n: 'Хомячок', price: 25 },
  {
    k: 'fish',
    e: '🐠',
    n: 'Рыбка',
    price: 20,
    breeds: [
      { k: 'fish:silver', e: '🐟', n: 'Серебрянка' },
      { k: 'fish:bright', e: '🐠', n: 'Пёстрая рыбка' },
      { k: 'fish:puff', e: '🐡', n: 'Пузырик' },
    ],
  },
  { k: 'turtle', e: '🐢', n: 'Черепашка', price: 40 },
  { k: 'parrot', e: '🦜', n: 'Попугай', price: 50 },
  { k: 'rabbit', e: '🐇', n: 'Кролик', price: 60 },
  { k: 'hedgehog', e: '🦔', n: 'Ёжик', price: 70 },
  {
    k: 'cat',
    e: '🐈',
    n: 'Котик',
    price: 80,
    breeds: [
      { k: 'cat:red', e: '🐈', n: 'Рыжий полосатик' },
      { k: 'cat:black', e: '🐈‍⬛', n: 'Чёрный Уголёк' },
    ],
  },
  {
    k: 'dog',
    e: '🐕',
    n: 'Щенок',
    price: 100,
    breeds: [
      { k: 'dog:lab', e: '🦮', n: 'Лабрадор' },
      { k: 'dog:poodle', e: '🐩', n: 'Пудель' },
      { k: 'dog:shepherd', e: '🐕‍🦺', n: 'Овчарка' },
      { k: 'dog:maltipoo', e: '🐕', n: 'Мальтипу' },
    ],
  },
  { k: 'pig', e: '🐖', n: 'Свинка', price: 90 },
  { k: 'cow', e: '🐄', n: 'Корова', price: 120 },
  { k: 'horse', e: '🐎', n: 'Лошадка', price: 150 },
  { k: 'flamingo', e: '🦩', n: 'Фламинго', price: 250 },
  { k: 'dragon', e: '🐉', n: 'Дракончик', price: 400 },
];
// еда — съедается сразу (кормим питомцев)
const FOOD: Good[] = [
  { k: 'nut', e: '🌰', n: 'Орешек', price: 3 },
  { k: 'carrot', e: '🥕', n: 'Морковка', price: 4 },
  { k: 'apple', e: '🍎', n: 'Яблочко', price: 4 },
  { k: 'milk', e: '🥛', n: 'Молочко', price: 5 },
  { k: 'bone', e: '🦴', n: 'Косточка', price: 5 },
  { k: 'cookie', e: '🍪', n: 'Печенька', price: 6 },
  { k: 'meat', e: '🥩', n: 'Мясо', price: 8 },
];
// вещи — остаются в домике навсегда (в кошельке хранятся с префиксом "t:")
const THINGS: Good[] = [
  { k: 't:bow', e: '🎀', n: 'Бантик', price: 10 },
  { k: 't:yarn', e: '🧶', n: 'Клубочек', price: 12 },
  { k: 't:ball', e: '⚽', n: 'Мячик', price: 15 },
  { k: 't:bowl', e: '🥣', n: 'Миска', price: 15 },
  { k: 't:frisbee', e: '🥏', n: 'Фрисби', price: 20 },
  { k: 't:bed', e: '🛏️', n: 'Лежанка', price: 30 },
  { k: 't:house', e: '🏠', n: 'Будка', price: 50 },
];
// старые покупки из первой версии магазина
const LEGACY: Record<string, CardInfo> = {
  hamster: { e: '🐹', n: 'Хомячок' },
  kitten: { e: '🐈', n: 'Котик' },
  puppy: { e: '🐕', n: 'Щенок' },
  pony: { e: '🐎', n: 'Пони' },
  unicorn: { e: '🦩', n: 'Фламинго' },
};

// ТЕСТОВЫЙ РЕЖИМ: всё по 1 монетке. Выключить — поставить false, вернутся настоящие цены выше.
const TEST_MODE = true;
if (TEST_MODE) {
  [PETS, FOOD, THINGS].forEach((list) => {
    list.forEach((item) => {
      item.price = 1;
    });
  });
}

// --- кошелёк общий с играми (@lib/wallet); тут только выборки ---
function ownedAll(): string[] {
  return loadWallet().p || [];
}
function ownedPets(): string[] {
  return ownedAll().filter((k) => k.indexOf('t:') !== 0);
}
function ownedThings(): string[] {
  return ownedAll().filter((k) => k.indexOf('t:') === 0);
}

function speak(text: string, pitch?: number, rate?: number): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ru-RU';
  u.rate = rate || 0.95;
  u.pitch = pitch || 1.1;
  window.speechSynthesis.speak(u);
}

// настоящие звуки животных из /assets/sounds/ (Wikimedia Commons, см. credits.txt);
// если файл не проиграется — запасной «голос» через синтез речи
const SOUND_ALIAS: Record<string, string> = {
  hamster: 'mouse',
  kitten: 'cat',
  puppy: 'dog',
  pony: 'horse',
  unicorn: 'flamingo',
};
const VOICES: Record<string, string> = {
  snail: 'Шур-шур…',
  mouse: 'Пи-пи-пи!',
  fish: 'Буль-буль!',
  turtle: 'Ш-ш-ш!',
  parrot: 'Прив-е-е-ет!',
  rabbit: 'Хрум-хрум!',
  hedgehog: 'Фыр-фыр-фыр!',
  cat: 'Мя-я-яу!',
  dog: 'Гав-гав!',
  horse: 'И-го-го-о!',
  flamingo: 'Га-га-га!',
  dragon: 'Р-р-р-р!',
  cow: 'Му-у-у!',
  pig: 'Хрю-хрю!',
  hamster: 'Пи-пи!',
};
const SOUND_KEYS = [
  'snail',
  'mouse',
  'fish',
  'turtle',
  'parrot',
  'rabbit',
  'hedgehog',
  'cat',
  'dog',
  'pig',
  'cow',
  'horse',
  'flamingo',
  'dragon',
];

// ================= деревушка: 2D-игра на Phaser =================
// кто в каком домике живёт: тип жилища + его название
const HOMES: Record<string, [string, string]> = {
  snail: ['garden', 'Грядка'],
  mouse: ['cage', 'Клетка'],
  hamster: ['cage', 'Клетка'],
  fish: ['pond', 'Пруд'],
  turtle: ['pond', 'Пруд'],
  parrot: ['birdcage', 'Птичья клетка'],
  rabbit: ['hutch', 'Крольчатник'],
  hedgehog: ['bush', 'Норка под кустом'],
  cat: ['cathouse', 'Кошкин дом'],
  kitten: ['cathouse', 'Кошкин дом'],
  dog: ['kennel', 'Будка'],
  puppy: ['kennel', 'Будка'],
  horse: ['stable', 'Конюшня'],
  pony: ['stable', 'Конюшня'],
  cow: ['barn', 'Хлев'],
  pig: ['barn', 'Хлев'],
  flamingo: ['lake', 'Озеро'],
  unicorn: ['lake', 'Озеро'],
  dragon: ['cave', 'Пещера'],
};
// реальные пропорции: лошадь в несколько раз больше черепашки (размер эмодзи в px)
const PSIZE: Record<string, number> = {
  snail: 16,
  mouse: 20,
  hamster: 22,
  fish: 24,
  turtle: 30,
  parrot: 30,
  hedgehog: 28,
  rabbit: 36,
  cat: 46,
  kitten: 36,
  dog: 54,
  puppy: 40,
  pig: 64,
  cow: 92,
  horse: 106,
  pony: 82,
  flamingo: 72,
  unicorn: 72,
  dragon: 112,
};
const PSIZE_KEY: Record<string, number> = {
  'dog:maltipoo': 42,
  'dog:poodle': 48,
}; // мелкие породы
// размеры домиков под жильца [ширина, высота]
const HOUSEDEF: Record<string, [number, number]> = {
  kennel: [96, 68],
  cathouse: [112, 80],
  stable: [204, 134],
  barn: [198, 132],
  hutch: [106, 76],
  shedh: [126, 88],
  cage: [64, 58],
  birdcage: [60, 56],
  pond: [122, 64],
  lake: [184, 94],
  bush: [106, 62],
  garden: [114, 54],
  cave: [172, 102],
};
const WALLC: Record<string, string> = {
  kennel: '#b98a5a',
  cathouse: '#ffd3e0',
  stable: '#a9743f',
  barn: '#d9480f',
  hutch: '#b98a5a',
  shedh: '#9db4c0',
};
const ROOFC: Record<string, string> = {
  kennel: '#7c5230',
  cathouse: '#f06595',
  stable: '#6f4a24',
  barn: '#a63106',
  hutch: '#7c5230',
  shedh: '#5f7a8a',
};
const DOORC: Record<string, string> = {
  kennel: '#42290f',
  cathouse: '#c2255c',
  stable: '#54351a',
  barn: '#8a2b06',
  hutch: '#6b4423',
  shedh: '#3e5561',
};

const GAME_W = 960;
const GAME_H = 640;

// места вдоль дорожки: нижние ряды ближе и крупнее, верхние — дальше и мельче
const SLOTS: [number, number][] = (() => {
  const s: [number, number][] = [];
  const rows = [600, 512, 424, 336, 248, 164, 84];
  rows.forEach((y, r) => {
    const xs = r % 2 ? [230, 560, 850] : [110, 400, 690, 880];
    xs.forEach((x, i) => {
      const jit = (((r * 13 + i * 7) % 7) - 3) * 9;
      s.push([Math.min(895, Math.max(65, x + jit)), y]);
    });
  });
  return s;
})();
// деревья и цветы: [эмодзи, x, y, размер]
const DECOR: [string, number, number, number][] = [
  ['🌳', 40, 380, 40],
  ['🌲', 924, 340, 36],
  ['🌼', 85, 608, 16],
  ['🌳', 912, 596, 44],
  ['🌼', 502, 492, 16],
  ['🌲', 232, 246, 30],
  ['🌼', 618, 388, 16],
  ['🌳', 838, 120, 28],
  ['🌼', 356, 96, 14],
  ['🌲', 50, 148, 26],
  ['🌼', 750, 516, 16],
];

function rr(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  // скруглённый прямоугольник на canvas
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// рисуем домик нужного типа в текстуру (один раз на тип)
function houseTexture(s: any, type: string): string {
  const key = 'home-' + type;
  if (s.textures.exists(key)) return key;
  const W = HOUSEDEF[type][0],
    H = HOUSEDEF[type][1];
  const t = s.textures.createCanvas(key, W, H);
  const c: CanvasRenderingContext2D = t.getContext();
  if (WALLC[type]) {
    // домик со стенами, крышей и дверью
    const wallY = H * 0.42;
    c.fillStyle = WALLC[type];
    rr(c, W * 0.03, wallY, W * 0.94, H - wallY - 1, 7);
    c.fill();
    if (type === 'hutch') {
      // сетка крольчатника
      c.strokeStyle = 'rgba(255,255,255,.35)';
      c.lineWidth = 2;
      for (let gx = W * 0.08; gx < W * 0.95; gx += 11) {
        c.beginPath();
        c.moveTo(gx, wallY + 3);
        c.lineTo(gx, H - 3);
        c.stroke();
      }
      for (let gy = wallY + 8; gy < H - 3; gy += 11) {
        c.beginPath();
        c.moveTo(W * 0.05, gy);
        c.lineTo(W * 0.95, gy);
        c.stroke();
      }
    }
    c.fillStyle = ROOFC[type];
    c.beginPath();
    c.moveTo(0, wallY + 4);
    c.lineTo(W / 2, 0);
    c.lineTo(W, wallY + 4);
    c.closePath();
    c.fill();
    const dw = W * 0.22,
      dh = (H - wallY) * 0.66;
    c.fillStyle = DOORC[type];
    rr(c, W / 2 - dw / 2, H - dh, dw, dh, dw * 0.35);
    c.fill();
    if (type === 'barn') {
      // крестовина на воротах хлева
      c.strokeStyle = '#f3c197';
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(W / 2 - dw / 2 + 4, H - dh + 4);
      c.lineTo(W / 2 + dw / 2 - 4, H - 4);
      c.moveTo(W / 2 + dw / 2 - 4, H - dh + 4);
      c.lineTo(W / 2 - dw / 2 + 4, H - 4);
      c.stroke();
    }
  } else if (type === 'cage' || type === 'birdcage') {
    const col = type === 'cage' ? '#7f8b98' : '#d99e00';
    c.fillStyle = 'rgba(255,255,255,.4)';
    c.beginPath();
    c.moveTo(3, H - 3);
    c.lineTo(3, H * 0.42);
    c.quadraticCurveTo(3, 4, W / 2, 4);
    c.quadraticCurveTo(W - 3, 4, W - 3, H * 0.42);
    c.lineTo(W - 3, H - 3);
    c.closePath();
    c.fill();
    c.strokeStyle = col;
    c.lineWidth = 3;
    c.stroke();
    for (let b = 1; b < 6; b++) {
      const bx = 3 + ((W - 6) * b) / 6;
      c.beginPath();
      c.moveTo(bx, H - 4);
      c.lineTo(bx, H * 0.22);
      c.stroke();
    }
    c.beginPath();
    c.arc(W / 2, 6, 5, Math.PI, 0);
    c.stroke(); // ручка
    c.fillStyle = col;
    c.fillRect(3, H - 7, W - 6, 4); // поддон
  } else if (type === 'pond' || type === 'lake') {
    const rg = c.createRadialGradient(
      W * 0.35,
      H * 0.32,
      4,
      W / 2,
      H / 2,
      W * 0.55,
    );
    rg.addColorStop(0, '#b3ecff');
    rg.addColorStop(0.55, '#66c7f0');
    rg.addColorStop(1, '#3aa4d8');
    c.fillStyle = rg;
    c.beginPath();
    c.ellipse(W / 2, H / 2, W / 2 - 2, H / 2 - 2, 0, 0, Math.PI * 2);
    c.fill();
    c.font = '18px sans-serif';
    c.textBaseline = 'bottom';
    c.fillText('🌾', 4, H - 2);
  } else if (type === 'bush') {
    c.fillStyle = '#4c8527';
    c.beginPath();
    c.ellipse(W / 2, H * 0.62, W / 2 - 2, H * 0.37, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#6faf3f';
    c.beginPath();
    c.arc(W * 0.32, H * 0.36, W * 0.2, 0, Math.PI * 2);
    c.arc(W * 0.64, H * 0.3, W * 0.21, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#332412';
    c.beginPath();
    c.arc(W / 2, H, 16, Math.PI, 0);
    c.closePath();
    c.fill(); // норка
  } else if (type === 'garden') {
    c.fillStyle = '#6f4324';
    rr(c, 0, 4, W, H - 4, 10);
    c.fill();
    c.fillStyle = '#8a5a33';
    for (let sy = 10; sy < H - 5; sy += 12) c.fillRect(4, sy, W - 8, 6);
    c.font = '20px sans-serif';
    c.textBaseline = 'top';
    c.fillText('🥬', W - 28, 0);
  } else if (type === 'cave') {
    const cg = c.createLinearGradient(0, 0, 0, H);
    cg.addColorStop(0, '#8b95a1');
    cg.addColorStop(1, '#5f6b78');
    c.fillStyle = cg;
    c.beginPath();
    c.moveTo(2, H);
    c.quadraticCurveTo(2, H * 0.14, W * 0.36, H * 0.07);
    c.quadraticCurveTo(W - 2, 0, W - 2, H);
    c.closePath();
    c.fill();
    c.fillStyle = '#2b3440';
    c.beginPath();
    c.arc(W / 2, H, H * 0.4, Math.PI, 0);
    c.closePath();
    c.fill(); // вход
  }
  t.refresh();
  return key;
}

// фон: газон с полосами, извилистая дорожка, деревья
function makeBackground(s: any): void {
  const t = s.textures.createCanvas('bg', GAME_W, GAME_H);
  const c: CanvasRenderingContext2D = t.getContext();
  const g = c.createLinearGradient(0, 0, GAME_W * 0.35, GAME_H);
  g.addColorStop(0, '#a9d774');
  g.addColorStop(1, '#7cb840');
  c.fillStyle = g;
  c.fillRect(0, 0, GAME_W, GAME_H);
  c.save();
  c.globalAlpha = 0.08;
  c.fillStyle = '#ffffff';
  c.translate(GAME_W / 2, GAME_H / 2);
  c.rotate(-Math.PI / 4);
  for (let i = -24; i < 24; i += 2)
    c.fillRect(i * 44, -GAME_H * 1.6, 44, GAME_H * 3.2);
  c.restore();
  c.beginPath();
  c.moveTo(-50, GAME_H * 0.87);
  c.bezierCurveTo(
    GAME_W * 0.25,
    GAME_H * 0.8,
    GAME_W * 0.34,
    GAME_H * 0.6,
    GAME_W * 0.52,
    GAME_H * 0.55,
  );
  c.bezierCurveTo(
    GAME_W * 0.72,
    GAME_H * 0.49,
    GAME_W * 0.82,
    GAME_H * 0.33,
    GAME_W + 50,
    GAME_H * 0.24,
  );
  c.strokeStyle = '#e9cf9e';
  c.lineWidth = 48;
  c.lineCap = 'round';
  c.stroke();
  c.strokeStyle = 'rgba(255,251,232,.95)';
  c.lineWidth = 4;
  c.setLineDash([16, 14]);
  c.stroke();
  c.setLineDash([]);
  t.refresh();
  s.add.image(0, 0, 'bg').setOrigin(0).setDepth(0);
  DECOR.forEach((d) => {
    s.add
      .text(d[1], d[2], d[0], { fontSize: d[3] + 'px' })
      .setOrigin(0.5, 1)
      .setDepth(d[2]);
  });
}

// найти карточку каталога по ключу покупки
function lookup(key: string): CardInfo | null {
  for (let i = 0; i < PETS.length; i++) {
    const p = PETS[i];
    if (p.k === key) return { e: p.e, n: p.n };
    if (p.breeds) {
      for (let j = 0; j < p.breeds.length; j++)
        if (p.breeds[j].k === key)
          return { e: p.breeds[j].e, n: p.breeds[j].n };
    }
  }
  for (let g = 0; g < THINGS.length; g++)
    if (THINGS[g].k === key) return { e: THINGS[g].e, n: THINGS[g].n };
  if (LEGACY[key]) return LEGACY[key];
  return null;
}

const COIN_SVG = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="8.5" />
  </svg>
);

function Price({ p }: { p: number }) {
  return (
    <span className="price">
      {COIN_SVG}
      {p}
    </span>
  );
}

const TABS: { t: Tab; label: string }[] = [
  { t: 'pets', label: 'Питомцы' },
  { t: 'food', label: 'Еда' },
  { t: 'things', label: 'Вещи' },
];

const TAB_HINTS: Record<Tab, string> = {
  pets: 'Выбирай друга — у щенков, котиков и рыбок есть разные породы!',
  food: 'Еда съедается сразу — питомцы обожают угощения!',
  things: 'Вещи остаются в домике навсегда.',
};

export default function PetShopPage() {
  const [wallet, setWallet] = useState<Wallet>({ e: 0, s: 0, p: [] });
  const [tab, setTab] = useState<Tab>('pets');
  const [hintOverride, setHintOverride] = useState<string | null>(null);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const walletRef = useRef<HTMLSpanElement>(null);
  const villageRef = useRef<HTMLDivElement>(null);
  const vsceneRef = useRef<any>(null);

  const coins = Math.max(0, (wallet.e || 0) - (wallet.s || 0));
  const have = wallet.p || [];
  const hasResidents = have.length > 0;

  // расставляем жителей по карте (вызывается после каждой покупки)
  function villageRefresh(): void {
    const s = vsceneRef.current;
    if (!s) return;
    s.vobjs.forEach((o: any) => {
      o.destroy();
    });
    s.vobjs = [];
    const pets = ownedPets(),
      things = ownedThings();
    const entries: { k?: string; it?: CardInfo | null; shed?: boolean }[] = pets
      .map((k) => ({ k, it: lookup(k) }))
      .filter((e) => e.it);
    if (things.length) entries.push({ shed: true });
    entries.forEach((en, i) => {
      const sl = SLOTS[i % SLOTS.length],
        x = sl[0],
        y = sl[1];
      const ds = 0.62 + (y / GAME_H) * 0.42; // перспектива: ближе — крупнее
      const hm = en.shed
        ? ['shedh', 'Сарайчик с вещами']
        : HOMES[en.k!.split(':')[0]] || ['kennel', 'Домик'];
      const type = hm[0];
      s.vobjs.push(
        s.add
          .image(x, y, houseTexture(s, type))
          .setOrigin(0.5, 1)
          .setScale(ds)
          .setDepth(y),
      );
      let labelText: string;
      let front: any;
      if (en.shed) {
        const em = things
          .map((k) => {
            const it = lookup(k);
            return it ? it.e : '';
          })
          .join('');
        front = s.add
          .text(x, y + 4, em, { fontSize: Math.round(20 * ds) + 'px' })
          .setOrigin(0.5, 1)
          .setDepth(y + 2);
        labelText = hm[1];
      } else {
        const base = en.k!.split(':')[0];
        const sz = (PSIZE_KEY[en.k!] || PSIZE[base] || 40) * ds;
        const inside =
          type === 'pond' ||
          type === 'lake' ||
          type === 'cage' ||
          type === 'birdcage';
        const py = inside ? y - HOUSEDEF[type][1] * ds * 0.18 : y + 6;
        front = s.add
          .text(x, py, en.it!.e, { fontSize: Math.round(sz) + 'px' })
          .setOrigin(0.5, 1)
          .setDepth(y + 2);
        front.isPet = true;
        front.setInteractive({ useHandCursor: true });
        const key = en.k!;
        const pet = front;
        pet.on('pointerdown', () => {
          petSay(pet, key);
        });
        labelText = en.it!.n + ' · ' + hm[1];
      }
      s.vobjs.push(front);
      s.vobjs.push(
        s.add
          .text(x, y + 8, labelText, {
            fontFamily: 'Nunito, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#3d5a1e',
            backgroundColor: 'rgba(255,255,255,.88)',
            padding: { x: 6, y: 2 },
          })
          .setOrigin(0.5, 0)
          .setDepth(y + 3),
      );
    });
  }

  // клик по питомцу: подпрыгивает и подаёт голос (настоящая запись, см. assets/sounds)
  function petSay(obj: any, key: string): void {
    let a = key.split(':')[0];
    a = SOUND_ALIAS[a] || a;
    const vscene = vsceneRef.current;
    try {
      if (vscene && vscene.cache.audio.exists(a)) {
        vscene.sound.stopAll();
        vscene.sound.play(a);
      } else speak(VOICES[a] || 'Привет!', 1.4, 1.05);
    } catch {
      speak(VOICES[a] || 'Привет!', 1.4, 1.05);
    }
    if (vscene && obj)
      vscene.tweens.add({
        targets: obj,
        y: obj.y - 16,
        duration: 150,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
  }

  // все питомцы радуются кормёжке
  function villageCelebrate(): void {
    const vscene = vsceneRef.current;
    if (!vscene) return;
    vscene.vobjs.forEach((o: any) => {
      if (o.isPet)
        vscene.tweens.add({
          targets: o,
          y: o.y - 14,
          duration: 170,
          yoyo: true,
          repeat: 1,
          ease: 'Quad.easeOut',
        });
    });
  }

  useEffect(() => {
    syncWallet(); // синхронизируем кошелёк при входе (в оригинале _wSave(_wLoad()))
    setWallet(loadWallet());

    // запускаем 2D-игру (сцена сама расставит жителей в vCreate)
    const PhaserLib = (window as any).Phaser;
    let game: any = null;
    if (PhaserLib && villageRef.current) {
      const vPreload = function (this: any) {
        SOUND_KEYS.forEach((k) => {
          this.load.audio(k, '/assets/sounds/' + k + '.mp3');
        });
      };
      const vCreate = function (this: any) {
        vsceneRef.current = this;
        this.vobjs = [];
        makeBackground(this);
        villageRefresh();
      };
      game = new PhaserLib.Game({
        type: PhaserLib.AUTO,
        parent: villageRef.current,
        width: GAME_W,
        height: GAME_H,
        transparent: true,
        scale: {
          mode: PhaserLib.Scale.FIT,
          autoCenter: PhaserLib.Scale.CENTER_BOTH,
        },
        scene: { preload: vPreload, create: vCreate },
      });
    }

    const onStorage = () => {
      setWallet(loadWallet());
      setHintOverride(null);
      setOpenCards({});
      villageRefresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      vsceneRef.current = null;
      if (game) game.destroy(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function shakeWallet(): void {
    const el = walletRef.current;
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  function burst(): void {
    burstConfetti(
      ['#f59f00', '#ffd43b', '#12b886', '#ff5a7a', '#3b6cf6', '#ff922b'],
      70,
    );
  }

  function buy(key: string, price: number, name: string): void {
    if (coinBalance() < price) {
      shakeWallet();
      return;
    }
    const w = loadWallet();
    w.s = (w.s || 0) + price;
    if (w.p.indexOf(key) < 0) w.p.push(key);
    saveWallet(w);
    setWallet(w);
    setHintOverride(null);
    setOpenCards({});
    villageRefresh();
    const isThing = key.indexOf('t:') === 0;
    speak(
      isThing
        ? 'Класс! Теперь у питомцев есть ' + name.toLowerCase() + '!'
        : 'Ура! У тебя новый друг — ' + name.toLowerCase() + '!',
    );
    burst();
  }

  function feed(f: Good): void {
    if (ownedPets().length === 0) {
      shakeWallet();
      setHintOverride('Сначала купи питомца — потом будет кого кормить!');
      return;
    }
    if (coinBalance() < f.price) {
      shakeWallet();
      return;
    }
    const w = loadWallet();
    w.s = (w.s || 0) + f.price;
    saveWallet(w);
    setWallet(w);
    setHintOverride(null);
    villageRefresh();
    // питомцы радостно подпрыгивают в своих домиках
    villageCelebrate();
    speak('Ням-ням! Питомцы говорят спасибо за ' + f.n.toLowerCase() + '!');
  }

  function buyButton(price: number, ownedFlag: boolean, onClick: () => void) {
    if (ownedFlag)
      return (
        <button type="button" disabled>
          Уже дома
        </button>
      );
    if (coins >= price)
      return (
        <button type="button" onClick={onClick}>
          Купить
        </button>
      );
    return (
      <button type="button" disabled>
        Не хватает
      </button>
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
        <span className="title">Зоомагазин</span>
        <span className="spacer" />
        <span className="wallet" id="wallet" ref={walletRef}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 8v8M9.5 10.2c0-1 1.1-1.7 2.5-1.7s2.5.7 2.5 1.7c0 2.6-5 1.2-5 3.7 0 1 1.1 1.7 2.5 1.7s2.5-.7 2.5-1.7" />
          </svg>
          <span id="coins">{coins}</span>
        </span>
      </header>

      <main className="stage">
        <div className="hint">
          Монетки даются за правильные ответы в любой игре.{' '}
          <b>Заработал — трать в зоомагазине!</b>
        </div>

        <h2 className="sect">
          Моя деревушка <small>у каждого питомца — свой домик!</small>
        </h2>
        <div className="village" id="village" ref={villageRef}>
          <div
            className="vsign"
            id="village-sign"
            style={{ display: hasResidents ? 'none' : undefined }}
          >
            Пока в деревушке никого… Заработай монетки в играх и купи первого
            жителя!
          </div>
        </div>

        <div
          className="seg"
          id="tabs"
          role="group"
          aria-label="Отделы магазина"
        >
          {TABS.map((b) => (
            <button
              key={b.t}
              type="button"
              data-t={b.t}
              aria-pressed={tab === b.t}
              onClick={() => {
                setTab(b.t);
                setHintOverride(null);
                setOpenCards({});
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="hint" id="tab-hint">
          {hintOverride ?? TAB_HINTS[tab]}
        </div>

        <div className="grid" id="shop">
          {tab === 'pets' &&
            PETS.map((p) => {
              if (p.breeds) {
                const ownedCnt = p.breeds.filter(
                  (b) => have.indexOf(b.k) >= 0,
                ).length;
                return (
                  <div
                    key={p.k}
                    className={'pet' + (openCards[p.k] ? ' open' : '')}
                    id={'card-' + p.k}
                  >
                    <span className="e">{p.e}</span>
                    <h3>{p.n}</h3>
                    <Price p={p.price} />
                    <button
                      type="button"
                      onClick={() =>
                        setOpenCards((o) => ({ ...o, [p.k]: !o[p.k] }))
                      }
                    >
                      {ownedCnt
                        ? 'Породы (' +
                          ownedCnt +
                          '/' +
                          p.breeds.length +
                          ' дома)'
                        : 'Выбрать породу'}
                    </button>
                    <div className="breeds">
                      {p.breeds.map((br) => {
                        const isOwned = have.indexOf(br.k) >= 0;
                        return (
                          <div
                            key={br.k}
                            className={'breed' + (isOwned ? ' owned' : '')}
                          >
                            <span className="be">{br.e}</span>
                            <span className="bn">{br.n}</span>
                            {buyButton(p.price, isOwned, () =>
                              buy(br.k, p.price, br.n),
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              const isOwned = have.indexOf(p.k) >= 0;
              return (
                <div
                  key={p.k}
                  className={'pet' + (isOwned ? ' owned' : '')}
                  id={'card-' + p.k}
                >
                  <span className="e">{p.e}</span>
                  <h3>{p.n}</h3>
                  <Price p={p.price} />
                  {buyButton(p.price, isOwned, () => buy(p.k, p.price, p.n))}
                </div>
              );
            })}

          {tab === 'food' &&
            FOOD.map((f) => (
              <div key={f.k} className="pet">
                <span className="e">{f.e}</span>
                <h3>{f.n}</h3>
                <Price p={f.price} />
                {coins >= f.price ? (
                  <button type="button" onClick={() => feed(f)}>
                    Покормить
                  </button>
                ) : (
                  <button type="button" disabled>
                    Не хватает
                  </button>
                )}
              </div>
            ))}

          {tab === 'things' &&
            THINGS.map((t) => {
              const isOwned = have.indexOf(t.k) >= 0;
              return (
                <div
                  key={t.k}
                  className={'pet' + (isOwned ? ' owned' : '')}
                  id={'card-' + t.k.replace(':', '-')}
                >
                  <span className="e">{t.e}</span>
                  <h3>{t.n}</h3>
                  <Price p={t.price} />
                  {buyButton(t.price, isOwned, () => buy(t.k, t.price, t.n))}
                </div>
              );
            })}
        </div>
      </main>
    </>
  );
}
