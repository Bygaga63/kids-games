import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { loadWallet, saveWallet, coinBalance, syncWallet } from '@lib/wallet';
import type { Wallet } from '@lib/wallet';
import { burstConfetti } from '@lib/confetti';
import { pick, shuffle } from '@lib/random';
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
// еда — съедается сразу (кормим кота и его друзей)
const FOOD: Good[] = [
  { k: 'nut', e: '🌰', n: 'Орешек', price: 3 },
  { k: 'carrot', e: '🥕', n: 'Морковка', price: 4 },
  { k: 'apple', e: '🍎', n: 'Яблочко', price: 4 },
  { k: 'milk', e: '🥛', n: 'Молочко', price: 5 },
  { k: 'bone', e: '🦴', n: 'Косточка', price: 5 },
  { k: 'cookie', e: '🍪', n: 'Печенька', price: 6 },
  { k: 'meat', e: '🥩', n: 'Мясо', price: 8 },
];
// вещи — остаются в комнате навсегда (в кошельке хранятся с префиксом "t:")
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
};

function petVoice(key: string): void {
  let a = key.split(':')[0];
  a = SOUND_ALIAS[a] || a;
  try {
    const audio = new Audio('/assets/sounds/' + a + '.mp3');
    audio.play().catch(() => speak(VOICES[a] || 'Привет!', 1.4, 1.05));
  } catch {
    speak(VOICES[a] || 'Привет!', 1.4, 1.05);
  }
}

// реальные пропорции эмодзи-друзей в комнате (px)
const PSIZE: Record<string, number> = {
  snail: 20,
  mouse: 24,
  hamster: 26,
  fish: 26,
  turtle: 32,
  parrot: 32,
  hedgehog: 30,
  rabbit: 38,
  cat: 44,
  kitten: 38,
  dog: 50,
  puppy: 40,
  pig: 56,
  cow: 72,
  horse: 80,
  pony: 64,
  flamingo: 60,
  unicorn: 60,
  dragon: 84,
};
// места друзей в комнате (по кругу от кота)
const SPOTS: CSSProperties[] = [
  { left: '13%', bottom: '22%' },
  { right: '13%', bottom: '24%' },
  { left: '24%', bottom: '13%' },
  { right: '25%', bottom: '12%' },
  { left: '6%', bottom: '36%' },
  { right: '6%', bottom: '38%' },
  { left: '36%', bottom: '8%' },
  { right: '37%', bottom: '7%' },
  { left: '16%', bottom: '46%' },
  { right: '17%', bottom: '48%' },
];

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

// --- уровень питомца: опыт за кормёжку (iu:pet:xp) ---
const XP_PER_LEVEL = 10;
function loadXp(): number {
  try {
    return parseInt(localStorage.getItem('iu:pet:xp') || '0', 10) || 0;
  } catch {
    return 0;
  }
}
function saveXp(xp: number): void {
  try {
    localStorage.setItem('iu:pet:xp', String(xp));
  } catch {}
}
function levelOf(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
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
    <path d="M12 8.2v7.6M9.8 10c0-.9 1-1.5 2.2-1.5s2.2.6 2.2 1.5c0 2.3-4.4 1.1-4.4 3.4 0 .9 1 1.5 2.2 1.5s2.2-.6 2.2-1.5" />
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

// большой кот — хозяин комнаты (в стиле котёнка с главной)
const BIG_CAT = (
  <svg viewBox="0 0 200 200" aria-hidden="true">
    {/* хвост */}
    <path
      className="tail"
      d="M152 150c26-4 34-28 24-46"
      stroke="#f2811d"
      strokeWidth="16"
      fill="none"
      strokeLinecap="round"
    />
    {/* тело */}
    <ellipse cx="100" cy="150" rx="56" ry="42" fill="#ff9f43" />
    <ellipse cx="100" cy="158" rx="34" ry="26" fill="#ffd8a8" />
    {/* уши */}
    <path d="M56 66 48 22l34 22z" fill="#f2811d" />
    <path d="M144 66l8-44-34 22z" fill="#f2811d" />
    <path d="M59 58l-5-24 20 13z" fill="#ffc9de" />
    <path d="M141 58l5-24-20 13z" fill="#ffc9de" />
    {/* голова */}
    <circle cx="100" cy="82" r="48" fill="#ff9f43" />
    {/* чёлка */}
    <path
      d="M78 44c6-10 16-14 22-14s16 4 22 14c-7-3-12-2-15 2-3-5-7-6-11-4-5 2-8 2-18 2z"
      fill="#ffd166"
    />
    {/* глаза */}
    <circle cx="82" cy="80" r="13" fill="#fff" />
    <circle cx="118" cy="80" r="13" fill="#fff" />
    <circle cx="84.5" cy="82.5" r="7" fill="#3b2313" />
    <circle cx="115.5" cy="82.5" r="7" fill="#3b2313" />
    <circle cx="87" cy="80" r="2.6" fill="#fff" />
    <circle cx="118" cy="80" r="2.6" fill="#fff" />
    {/* бровки */}
    <path
      d="M72 62c3-4 8-5 12-3M116 59c4-2 9-1 12 3"
      stroke="#e78a2e"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    {/* щёки */}
    <circle cx="68" cy="96" r="8" fill="#ffb8cf" opacity=".7" />
    <circle cx="132" cy="96" r="8" fill="#ffb8cf" opacity=".7" />
    {/* нос и рот */}
    <path d="M94 96h12l-6 8z" fill="#ff7aa2" />
    <path
      d="M100 104v4M100 108c-3 4-8 4-11 1M100 108c3 4 8 4 11 1"
      stroke="#7a4a1d"
      strokeWidth="2.6"
      fill="none"
      strokeLinecap="round"
    />
    {/* усы */}
    <path
      d="M52 90h16M54 99l15-3M148 90h-16M146 99l-15-3"
      stroke="#e78a2e"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    {/* медалька на груди */}
    <circle cx="100" cy="140" r="13" fill="#ff922b" />
    <circle cx="100" cy="140" r="7.5" fill="#ffd43b" />
    {/* лапки */}
    <ellipse cx="76" cy="186" rx="15" ry="10" fill="#ffb367" />
    <ellipse cx="124" cy="186" rx="15" ry="10" fill="#ffb367" />
    <path
      d="M71 182v7M81 182v7M119 182v7M129 182v7"
      stroke="#f2811d"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

const TABS: { t: Tab; label: string }[] = [
  { t: 'pets', label: 'Питомцы' },
  { t: 'food', label: 'Еда' },
  { t: 'things', label: 'Вещи' },
];

const TAB_HINTS: Record<Tab, string> = {
  pets: 'Выбирай друга — у щенков, котиков и рыбок есть разные породы!',
  food: 'Еда съедается сразу — питомцы обожают угощения!',
  things: 'Вещи остаются в комнате навсегда.',
};

export default function PetShopPage() {
  const [wallet, setWallet] = useState<Wallet>({ e: 0, s: 0, p: [] });
  const [xp, setXp] = useState(0);
  const [wish, setWish] = useState<Good | null>(null);
  const [dishes, setDishes] = useState<Good[]>([]);
  const [servedKey, setServedKey] = useState<string | null>(null);
  const [mood, setMood] = useState<'yum' | 'party' | null>(null);
  const [heartsKey, setHeartsKey] = useState(0);
  const [bouncing, setBouncing] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('pets');
  const [hintOverride, setHintOverride] = useState<string | null>(null);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const walletRef = useRef<HTMLSpanElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const coins = Math.max(0, (wallet.e || 0) - (wallet.s || 0));
  const have = wallet.p || [];
  const level = levelOf(xp);
  const levelPct = ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;

  const companions = have
    .filter((k) => k.indexOf('t:') !== 0)
    .map((k) => ({ k, it: lookup(k) }))
    .filter((x): x is { k: string; it: CardInfo } => x.it !== null);
  const ownedThings = have
    .filter((k) => k.indexOf('t:') === 0)
    .map((k) => lookup(k))
    .filter((it): it is CardInfo => it !== null);

  function newTable(): void {
    const wishF = pick(FOOD);
    const others = shuffle(FOOD.filter((f) => f.k !== wishF.k)).slice(0, 2);
    setWish(wishF);
    setDishes(shuffle([wishF, ...others]));
  }

  useEffect(() => {
    syncWallet(); // синхронизируем кошелёк при входе (в оригинале _wSave(_wLoad()))
    setWallet(loadWallet());
    setXp(loadXp());
    newTable();
    const onStorage = () => {
      setWallet(loadWallet());
      setXp(loadXp());
      setHintOverride(null);
      setOpenCards({});
    };
    window.addEventListener('storage', onStorage);
    const t = timers.current;
    return () => {
      window.removeEventListener('storage', onStorage);
      t.forEach(clearTimeout);
    };
  }, []);

  function later(fn: () => void, ms: number): void {
    timers.current.push(setTimeout(fn, ms));
  }

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

  function addXp(n: number): void {
    setXp((x) => {
      const nx = x + n;
      saveXp(nx);
      if (levelOf(nx) > levelOf(x)) {
        burst();
        later(() => speak('Ура! Новый уровень!'), 400);
      }
      return nx;
    });
  }

  // покормить кота с общего стола (или из магазина)
  function serve(f: Good): void {
    if (servedKey) return; // ждём, пока дожуёт
    if (coinBalance() < f.price) {
      shakeWallet();
      return;
    }
    const w = loadWallet();
    w.s = (w.s || 0) + f.price;
    saveWallet(w);
    setWallet(w);
    const isWish = wish !== null && f.k === wish.k;
    setServedKey(f.k);
    setMood(isWish ? 'party' : 'yum');
    if (isWish) setHeartsKey((k) => k + 1);
    addXp(isWish ? 3 : 1);
    speak(
      isWish
        ? 'Ням-ням! Обожаю ' + f.n.toLowerCase() + '!'
        : 'Ням-ням! Спасибо за ' + f.n.toLowerCase() + '!',
    );
    later(() => {
      setServedKey(null);
      setMood(null);
      if (isWish) newTable();
    }, 1300);
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
    const isThing = key.indexOf('t:') === 0;
    speak(
      isThing
        ? 'Класс! Теперь в комнате есть ' + name.toLowerCase() + '!'
        : 'Ура! У тебя новый друг — ' + name.toLowerCase() + '!',
    );
    burst();
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
    <div className="room">
      {/* декорации комнаты */}
      <div className="wall" aria-hidden="true">
        <span className="hangstar s1">✦</span>
        <span className="hangstar s2">✧</span>
        <span className="hangstar s3">🌙</span>
        <div className="window w1">
          <span className="moon">🌙</span>
          <span className="wstar">✦</span>
        </div>
        <div className="window w2">
          <span className="wstar">✧</span>
          <span className="wstar two">✦</span>
        </div>
        <span className="prop plant">🪴</span>
        <span className="prop pic">🖼️</span>
      </div>
      <div className="floor" aria-hidden="true">
        <div className="rug" />
        <span className="prop yarn">🧶</span>
        <span className="prop book">📖</span>
        <span className="prop dino">🦖</span>
      </div>

      {/* верхняя панель */}
      <a className="scene-back" href="/" title="К играм">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </a>
      <div className="lvl" title={`Опыт: ${xp}`}>
        <b>{level} уровень</b>
        <span className="lvlbar">
          <i style={{ width: `${levelPct}%` }} />
        </span>
        <span className="lvlstar">⭐</span>
      </div>
      <div className="scene-right">
        <span className="wallet" ref={walletRef}>
          {COIN_SVG}
          <span>{coins}</span>
        </span>
        <button
          className="shopbtn"
          type="button"
          onClick={() => setShopOpen(true)}
        >
          Магазин <span aria-hidden="true">🎁</span>
        </button>
      </div>

      {/* большой кот и пузырь с хотелкой */}
      <div className="pethero">
        {mood === 'party' && (
          <div className="hearts" key={heartsKey} aria-hidden="true">
            <i>💛</i>
            <i>💗</i>
            <i>💖</i>
          </div>
        )}
        <button
          className={'bigcat' + (mood ? ' ' + mood : '')}
          type="button"
          title="Погладить кота"
          onClick={() => petVoice('cat')}
        >
          {BIG_CAT}
        </button>
        {wish && !mood && (
          <div className="bubble" aria-label={'Кот хочет: ' + wish.n}>
            <span className="plate">🍽️</span>
            <span className="want">{wish.e}</span>
          </div>
        )}
        {mood && (
          <div className="bubble yumtxt">
            {mood === 'party' ? 'Обожаю!' : 'Ням-ням!'}
          </div>
        )}
      </div>

      {/* купленные друзья и вещи в комнате */}
      {companions.map((c, i) => (
        <button
          key={c.k}
          type="button"
          className={'buddy' + (bouncing === c.k ? ' jump' : '')}
          style={{
            ...SPOTS[i % SPOTS.length],
            fontSize: (PSIZE[c.k.split(':')[0]] || 36) + 'px',
          }}
          title={c.it.n}
          onClick={() => {
            petVoice(c.k);
            setBouncing(c.k);
            later(() => setBouncing(null), 450);
          }}
        >
          {c.it.e}
        </button>
      ))}
      {ownedThings.length > 0 && (
        <div className="shelf" title="Вещи питомцев">
          {ownedThings.map((t, i) => (
            <span key={i}>{t.e}</span>
          ))}
        </div>
      )}

      {/* стол с едой */}
      <div className="table">
        <div className="dishes">
          {dishes.map((f) => (
            <div key={f.k} className="dish">
              <span className="plate-food" aria-hidden="true">
                <i className="plate-oval" />
                <b>{f.e}</b>
              </span>
              <span className="fname">{f.n}</span>
              <span className="fprice">
                {f.price}
                {COIN_SVG}
              </span>
              {servedKey === f.k ? (
                <button className="add done" type="button" disabled>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 13l4 4 10-10" />
                  </svg>
                </button>
              ) : (
                <button className="add" type="button" onClick={() => serve(f)}>
                  Добавить
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="tablelegs" aria-hidden="true" />
      </div>

      {/* выдвижной магазин */}
      {shopOpen && (
        <div className="drawer-wrap" onClick={() => setShopOpen(false)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()}>
            <header className="dhead">
              <h2>Магазин</h2>
              <span className="wallet small">
                {COIN_SVG}
                <span>{coins}</span>
              </span>
              <button
                className="dclose"
                type="button"
                aria-label="Закрыть"
                onClick={() => setShopOpen(false)}
              >
                ✕
              </button>
            </header>
            <div className="seg" role="group" aria-label="Отделы магазина">
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
            <div className="hint">{hintOverride ?? TAB_HINTS[tab]}</div>

            <div className="grid">
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
                      {buyButton(p.price, isOwned, () =>
                        buy(p.k, p.price, p.n),
                      )}
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
                      <button type="button" onClick={() => serve(f)}>
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
                      {buyButton(t.price, isOwned, () =>
                        buy(t.k, t.price, t.n),
                      )}
                    </div>
                  );
                })}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
