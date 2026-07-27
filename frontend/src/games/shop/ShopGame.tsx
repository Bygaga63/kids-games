import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { say as sayClip } from '@lib/voice';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './shop.css';

// товар: эмодзи, название на полке, форма для фразы «Найди …»
type Product = { e: string; n: string; acc: string };

const PRODUCTS: Product[] = [
  { e: '🍞', n: 'Хлеб', acc: 'хлеб' },
  { e: '🥛', n: 'Молоко', acc: 'молоко' },
  { e: '🧀', n: 'Сыр', acc: 'сыр' },
  { e: '🥚', n: 'Яйца', acc: 'яйца' },
  { e: '🍎', n: 'Яблоки', acc: 'яблоки' },
  { e: '🍌', n: 'Бананы', acc: 'бананы' },
  { e: '🥕', n: 'Морковка', acc: 'морковку' },
  { e: '🥔', n: 'Картошка', acc: 'картошку' },
  { e: '🍅', n: 'Помидоры', acc: 'помидоры' },
  { e: '🥒', n: 'Огурцы', acc: 'огурцы' },
  { e: '🧅', n: 'Лук', acc: 'лук' },
  { e: '🍗', n: 'Курица', acc: 'курицу' },
  { e: '🐟', n: 'Рыба', acc: 'рыбу' },
  { e: '🧈', n: 'Масло', acc: 'масло' },
  { e: '🍯', n: 'Мёд', acc: 'мёд' },
  { e: '🍝', n: 'Макароны', acc: 'макароны' },
  { e: '🍪', n: 'Печенье', acc: 'печенье' },
  { e: '🧃', n: 'Сок', acc: 'сок' },
  { e: '🍫', n: 'Шоколадка', acc: 'шоколадку' },
  { e: '🍦', n: 'Мороженое', acc: 'мороженое' },
];

const LIST_LEN = 10;
const CONFETTI_COLORS = [
  '#f08c00',
  '#ffc078',
  '#12b886',
  '#ffd43b',
  '#ff5a7a',
  '#3b6cf6',
];

// озвучка — предзаписанный клип, при отсутствии — speechSynthesis
const say = (text: string) => sayClip(text, 'ru');

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

export default function ShopGame() {
  const [shelf, setShelf] = useState<Product[]>([]);
  const [list, setList] = useState<Product[]>([]);
  const [idx, setIdx] = useState(0);
  const [askName, setAskName] = useState<string | null>(null);
  const [got, setGot] = useState<string[]>([]);
  const [grabbing, setGrabbing] = useState<string | null>(null);
  const [shake, setShake] = useState<{ n: string; k: number } | null>(null);
  const [toast, setToast] = useState<{
    text: string;
    kind: 'good' | 'bad';
  } | null>(null);
  const [ended, setEnded] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [endRes, setEndRes] = useState('');

  const mistakesRef = useRef(0);
  const perfectRef = useRef(0);
  const firstTryRef = useRef(true);
  const lockedRef = useRef(false);
  const listRef = useRef<Product[]>([]);

  useEffect(() => {
    syncWallet();
    newGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function newGame() {
    mistakesRef.current = 0;
    perfectRef.current = 0;
    lockedRef.current = false;
    setIdx(0);
    setGot([]);
    setGrabbing(null);
    setShake(null);
    setToast(null);
    setEnded(false);
    setStarsOn(0);

    const newShelf = shuffle(PRODUCTS);
    const newList = shuffle(newShelf).slice(0, LIST_LEN);
    setShelf(newShelf);
    setList(newList);
    listRef.current = newList;

    askNext(0);
  }

  function askNext(i: number) {
    firstTryRef.current = true;
    const p = listRef.current[i];
    setAskName(p.n);
    say('Найди ' + p.acc);
  }

  function pick(p: Product) {
    if (lockedRef.current || got.includes(p.n)) return;
    const want = list[idx];
    if (p.n !== want.n) {
      mistakesRef.current++;
      firstTryRef.current = false;
      setShake({ n: p.n, k: Date.now() }); // перезапуск shake-анимации
      setToast({
        text:
          'Это ' + p.n.toLowerCase() + '. А нам нужно: ' + want.n.toLowerCase(),
        kind: 'bad',
      });
      return;
    }
    if (firstTryRef.current) {
      perfectRef.current++;
      addCoins(1);
    }
    setGrabbing(p.n);
    setTimeout(() => {
      setGrabbing((g) => (g === p.n ? null : g));
      setGot((s) => [...s, p.n]);
    }, 480);
    const newIdx = idx + 1;
    setIdx(newIdx);
    setToast({ text: want.n + ' — в корзине!', kind: 'good' });
    if (newIdx >= LIST_LEN) {
      lockedRef.current = true;
      setTimeout(finish, 700);
    } else {
      setTimeout(() => askNext(newIdx), 750);
    }
  }

  function finish() {
    say('Молодец! Все покупки собраны!');
    const mistakes = mistakesRef.current;
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
    for (let i = 0; i < stars; i++) {
      setTimeout(() => setStarsOn(i + 1), 250 + i * 220);
    }
    setEndRes(
      mistakes === 0
        ? 'Ни одной ошибки — настоящий помощник!'
        : 'Ошибок по пути: ' + mistakes,
    );
    setToast(null);
    setEnded(true);
    burstConfetti(CONFETTI_COLORS, 70);
    saveBest('shop', perfectRef.current);
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
        <span className="title">Продуктовый магазин</span>
        <span className="spacer" />
        <span className="chip">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 9h14l-1.5 9.5a2 2 0 0 1-2 1.5h-7a2 2 0 0 1-2-1.5z" />
            <path d="M8.5 9 12 3.5 15.5 9" />
          </svg>
          <span>{idx}</span>/10
        </span>
      </header>

      <main className="stage">
        {!ended && (
          <div className="ask">
            <span className="txt">
              {askName ? (
                <>
                  Найди: <b>{askName}</b>
                </>
              ) : (
                'Слушай, что нужно купить…'
              )}
            </span>
            <button
              className="say"
              type="button"
              onClick={() => {
                if (idx < LIST_LEN && !lockedRef.current)
                  say('Найди ' + list[idx].acc);
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
                <path d="M4 10v4h4l5 4V6L8 10H4z" />
                <path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11" />
              </svg>
              Скажи ещё раз
            </button>
          </div>
        )}

        {!ended && (
          <div className="shelves">
            {[0, 1, 2, 3].map((r) => (
              <div className="shelfrow" key={r}>
                <div className="items">
                  {shelf.slice(r * 5, r * 5 + 5).map((p) => (
                    <button
                      key={
                        p.n + (shake && shake.n === p.n ? ':' + shake.k : '')
                      }
                      className={
                        'item' +
                        (grabbing === p.n ? ' grab' : '') +
                        (got.includes(p.n) ? ' got' : '') +
                        (shake && shake.n === p.n ? ' no' : '')
                      }
                      type="button"
                      aria-label={p.n}
                      title={p.n}
                      onClick={() => pick(p)}
                    >
                      {p.e}
                    </button>
                  ))}
                </div>
                <div className="plank" />
              </div>
            ))}
          </div>
        )}

        <div className={'toast' + (toast ? ' ' + toast.kind : '')}>
          {toast?.text ?? ''}
        </div>

        {ended && (
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
            <div className="big">Все покупки собраны!</div>
            <div className="res">{endRes}</div>
            <button className="btn" type="button" onClick={newGame}>
              Сходить в магазин ещё раз
            </button>
          </div>
        )}
      </main>
    </>
  );
}
