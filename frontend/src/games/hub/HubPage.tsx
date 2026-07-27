import { useEffect, useState, type CSSProperties } from 'react';
import { coinBalance } from '@lib/wallet';
import { getBest } from '@lib/best';
import { HUB_CARDS, type AgeGroup, type HubCard } from './hubData';
import './hub.css';

type AgeKey = AgeGroup | 'all';

const LABELS: Record<AgeKey, string> = {
  a: '3–4 года',
  b: '5–6 лет',
  c: '7–8 лет',
  all: 'Все игры',
};

function plural(n: number, one: string, few: string, many: string): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
  return many;
}

const STAR_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
  </svg>
);

const GO_SVG = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const PAW_SICO = (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="7.2" cy="7.6" r="1.5" />
    <circle cx="12" cy="6.4" r="1.5" />
    <circle cx="16.8" cy="7.6" r="1.5" />
    <path d="M12 11c-3.1 0-5.6 2.3-5.6 4.8 0 1.7 1.3 3 2.9 3 1 0 1.8-.4 2.7-.4s1.7.4 2.7.4c1.6 0 2.9-1.3 2.9-3 0-2.5-2.5-4.8-5.6-4.8z" />
  </svg>
);

const GAME_CARDS = HUB_CARDS.filter((c) => c.section === 'games');
const RIDDLE_CARDS = HUB_CARDS.filter((c) => c.section === 'riddles');
const SHOP_CARD = HUB_CARDS.find((c) => c.section === 'shop')!;

/** показывать ли карточку при выбранном возрасте (как в оригинале: data-age||'a b c') */
function isShown(card: HubCard, age: AgeKey | null): boolean {
  if (age === null || age === 'all') return true;
  return (card.ages ?? ['a', 'b', 'c']).includes(age);
}

function PlayCard({
  card,
  shown,
  best,
}: {
  card: HubCard;
  shown: boolean;
  best: number;
}) {
  const style = {
    '--c': card.c,
    '--c2': card.c2,
    ...(shown ? null : { display: 'none' }),
  } as CSSProperties;
  return (
    <a
      className="card play"
      style={style}
      href={card.href}
      data-key={card.key}
      data-age={card.ages?.join(' ')}
    >
      <span className="ico" aria-hidden="true">
        {card.icon}
      </span>
      <h3>{card.title}</h3>
      <p>{card.desc}</p>
      {best > 0 ? (
        <span className="stars">
          {STAR_SVG} рекорд {best}
        </span>
      ) : (
        <span className="tag" data-tag="">
          Играть
        </span>
      )}
      <span className="go" aria-hidden="true">
        {GO_SVG}
      </span>
    </a>
  );
}

export default function HubPage() {
  const [age, setAge] = useState<AgeKey | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [chipHidden, setChipHidden] = useState(false);
  const [balance, setBalance] = useState(0);
  const [bests, setBests] = useState<Record<string, number>>({});

  useEffect(() => {
    // рекорды на карточках (iu:best:<key>)
    const b: Record<string, number> = {};
    HUB_CARDS.forEach((c) => {
      if (c.section !== 'shop') b[c.key] = getBest(c.key);
    });
    setBests(b);
    setBalance(coinBalance());
    // фильтр игр по возрасту; выбор запоминается
    const saved = localStorage.getItem('iu:age');
    if (saved && saved in LABELS) {
      apply(saved as AgeKey);
    } else {
      setGateOpen(true);
      setChipHidden(true);
    }
  }, []);

  function apply(g: AgeKey) {
    localStorage.setItem('iu:age', g);
    setAge(g);
    setBalance(coinBalance());
    setChipHidden(false);
    setGateOpen(false);
  }

  const playCards = [...GAME_CARDS, ...RIDDLE_CARDS];
  const n = playCards.filter((c) => isShown(c, age)).length;
  const riddlesVisible = RIDDLE_CARDS.some((c) => isShown(c, age));

  const eyebrowText =
    age === null
      ? '35 игр · 4–8 лет'
      : `${n} ${plural(n, 'игра', 'игры', 'игр')} · ${age === 'all' ? '4–8 лет' : LABELS[age]}`;

  const footerText =
    age === null
      ? 'Готово 35 игр — выбирай и играй!'
      : age === 'all'
        ? `Готово ${n} ${plural(n, 'игра', 'игры', 'игр')} — выбирай и играй!`
        : `Подобрали ${n} ${plural(n, 'игру', 'игры', 'игр')} для возраста ${LABELS[age]}`;

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <span className="mark" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
            </svg>
          </span>
          Играй{' '}и{' '}
          <b>учись</b>
        </div>
        <a className="grown" href="#" onClick={(e) => e.preventDefault()}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z" />
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8" />
            <path d="M12 17h.01" />
          </svg>
          Для родителей
        </a>
        {age === null ? (
          <button
            className="agechip"
            id="agechip"
            type="button"
            style={chipHidden ? { display: 'none' } : undefined}
          >
            Возраст
          </button>
        ) : (
          <button
            className="coinchip"
            id="agechip"
            type="button"
            title={
              'Твои монетки — нажми, чтобы открыть зоомагазин. Возраст: ' +
              LABELS[age]
            }
            onClick={() => {
              location.href = '/pet-shop';
            }}
          >
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
            <span>{balance}</span>
          </button>
        )}
      </header>

      <section className="hero">
        <span className="eyebrow">
          <span className="dot"></span>
          {eyebrowText}
        </span>
        <h1>
          Выбери игру и{' '}
          <span className="pop">поехали!</span>
        </h1>
        <p>
          Учим цвета, буквы, счёт и числа в коротких весёлых играх. Нажми на
          карточку — и сразу играй, без регистрации.
        </p>
      </section>

      <main className="grid" id="grid">
        {GAME_CARDS.map((card) => (
          <PlayCard
            key={card.key}
            card={card}
            shown={isShown(card, age)}
            best={bests[card.key] ?? 0}
          />
        ))}
      </main>

      <h2
        className="sect"
        style={riddlesVisible ? undefined : { display: 'none' }}
      >
        <span className="sico" aria-hidden="true">
          ?
        </span>
        Загадки <small>слушай и отгадывай</small>
      </h2>
      <div
        className="grid"
        style={riddlesVisible ? undefined : { display: 'none' }}
      >
        {RIDDLE_CARDS.map((card) => (
          <PlayCard
            key={card.key}
            card={card}
            shown={isShown(card, age)}
            best={bests[card.key] ?? 0}
          />
        ))}
      </div>

      <h2 className="sect">
        <span
          className="sico"
          aria-hidden="true"
          style={{
            background: 'linear-gradient(135deg,#ffd43b,#f59f00)',
            boxShadow: '0 8px 16px rgba(245,159,0,.3)',
          }}
        >
          {PAW_SICO}
        </span>
        Зоомагазин <small>питомцы, еда и вещи за монетки</small>
      </h2>
      <div className="grid">
        <a
          className="card shopcard"
          style={{ '--c': SHOP_CARD.c, '--c2': SHOP_CARD.c2 } as CSSProperties}
          href={SHOP_CARD.href}
          data-key={SHOP_CARD.key}
        >
          <span className="ico" aria-hidden="true">
            {SHOP_CARD.icon}
          </span>
          <h3>{SHOP_CARD.title}</h3>
          <p>{SHOP_CARD.desc}</p>
          <span className="tag" id="coin-tag">
            Монетки: {balance}
          </span>
          <span className="go" aria-hidden="true">
            {GO_SVG}
          </span>
        </a>
      </div>

      <footer>
        <span className="made">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ff5a7a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20s-7-4.3-9.3-8.3C1 8.5 2.5 5 6 5c2 0 3 1.2 4 2.5C11 6.2 12 5 14 5c3.5 0 5 3.5 3.3 6.7C19 15.7 12 20 12 20z" />
          </svg>
          Сделано для детей <b>4–8 лет</b>
        </span>
        <span>{footerText}</span>
        <button
          className="agelink"
          id="agelink"
          type="button"
          onClick={() => setGateOpen(true)}
        >
          Сменить возраст
        </button>
      </footer>

      <div className="agegate" id="agegate" hidden={!gateOpen}>
        <div className="agebox">
          <h2>Сколько тебе лет?</h2>
          <p>Покажем игры, которые подходят по возрасту</p>
          <div className="ages">
            <button type="button" data-g="a" onClick={() => apply('a')}>
              <b>3–4</b>
              <span>года</span>
            </button>
            <button type="button" data-g="b" onClick={() => apply('b')}>
              <b>5–6</b>
              <span>лет</span>
            </button>
            <button type="button" data-g="c" onClick={() => apply('c')}>
              <b>7–8</b>
              <span>лет</span>
            </button>
            <button type="button" data-g="all" onClick={() => apply('all')}>
              <b>Все игры</b>
              <span>без фильтра</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
