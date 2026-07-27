import { useEffect, useRef, useState } from 'react';
import { addCoins, syncWallet } from '@lib/wallet';
import { sfx } from '@lib/sfx';
import { shuffle } from '@lib/random';
import { saveBest } from '@lib/best';
import { burstConfetti } from '@lib/confetti';
import './countries.css';

type Country = { f: string; n: string; cap: string };

// 123 страны: флаг-эмодзи, название, столица
const DATA: Country[] = [
  { f: '🇷🇺', n: 'Россия', cap: 'Москва' },
  { f: '🇫🇷', n: 'Франция', cap: 'Париж' },
  { f: '🇩🇪', n: 'Германия', cap: 'Берлин' },
  { f: '🇮🇹', n: 'Италия', cap: 'Рим' },
  { f: '🇪🇸', n: 'Испания', cap: 'Мадрид' },
  { f: '🇵🇹', n: 'Португалия', cap: 'Лиссабон' },
  { f: '🇳🇱', n: 'Нидерланды', cap: 'Амстердам' },
  { f: '🇧🇪', n: 'Бельгия', cap: 'Брюссель' },
  { f: '🇨🇭', n: 'Швейцария', cap: 'Берн' },
  { f: '🇦🇹', n: 'Австрия', cap: 'Вена' },
  { f: '🇵🇱', n: 'Польша', cap: 'Варшава' },
  { f: '🇺🇦', n: 'Украина', cap: 'Киев' },
  { f: '🇧🇾', n: 'Беларусь', cap: 'Минск' },
  { f: '🇨🇿', n: 'Чехия', cap: 'Прага' },
  { f: '🇸🇰', n: 'Словакия', cap: 'Братислава' },
  { f: '🇭🇺', n: 'Венгрия', cap: 'Будапешт' },
  { f: '🇷🇴', n: 'Румыния', cap: 'Бухарест' },
  { f: '🇧🇬', n: 'Болгария', cap: 'София' },
  { f: '🇬🇷', n: 'Греция', cap: 'Афины' },
  { f: '🇸🇪', n: 'Швеция', cap: 'Стокгольм' },
  { f: '🇳🇴', n: 'Норвегия', cap: 'Осло' },
  { f: '🇫🇮', n: 'Финляндия', cap: 'Хельсинки' },
  { f: '🇩🇰', n: 'Дания', cap: 'Копенгаген' },
  { f: '🇮🇸', n: 'Исландия', cap: 'Рейкьявик' },
  { f: '🇮🇪', n: 'Ирландия', cap: 'Дублин' },
  { f: '🇬🇧', n: 'Великобритания', cap: 'Лондон' },
  { f: '🇭🇷', n: 'Хорватия', cap: 'Загреб' },
  { f: '🇷🇸', n: 'Сербия', cap: 'Белград' },
  { f: '🇸🇮', n: 'Словения', cap: 'Любляна' },
  { f: '🇱🇹', n: 'Литва', cap: 'Вильнюс' },
  { f: '🇱🇻', n: 'Латвия', cap: 'Рига' },
  { f: '🇪🇪', n: 'Эстония', cap: 'Таллин' },
  { f: '🇱🇺', n: 'Люксембург', cap: 'Люксембург' },
  { f: '🇲🇹', n: 'Мальта', cap: 'Валлетта' },
  { f: '🇦🇱', n: 'Албания', cap: 'Тирана' },
  { f: '🇲🇩', n: 'Молдова', cap: 'Кишинёв' },
  { f: '🇧🇦', n: 'Босния и Герцеговина', cap: 'Сараево' },
  { f: '🇲🇰', n: 'Северная Македония', cap: 'Скопье' },
  { f: '🇲🇪', n: 'Черногория', cap: 'Подгорица' },
  { f: '🇨🇾', n: 'Кипр', cap: 'Никосия' },
  { f: '🇲🇨', n: 'Монако', cap: 'Монако' },

  { f: '🇨🇳', n: 'Китай', cap: 'Пекин' },
  { f: '🇯🇵', n: 'Япония', cap: 'Токио' },
  { f: '🇰🇷', n: 'Южная Корея', cap: 'Сеул' },
  { f: '🇮🇳', n: 'Индия', cap: 'Нью-Дели' },
  { f: '🇮🇩', n: 'Индонезия', cap: 'Джакарта' },
  { f: '🇹🇭', n: 'Таиланд', cap: 'Бангкок' },
  { f: '🇻🇳', n: 'Вьетнам', cap: 'Ханой' },
  { f: '🇲🇾', n: 'Малайзия', cap: 'Куала-Лумпур' },
  { f: '🇸🇬', n: 'Сингапур', cap: 'Сингапур' },
  { f: '🇵🇭', n: 'Филиппины', cap: 'Манила' },
  { f: '🇰🇿', n: 'Казахстан', cap: 'Астана' },
  { f: '🇺🇿', n: 'Узбекистан', cap: 'Ташкент' },
  { f: '🇰🇬', n: 'Киргизия', cap: 'Бишкек' },
  { f: '🇹🇯', n: 'Таджикистан', cap: 'Душанбе' },
  { f: '🇹🇲', n: 'Туркмения', cap: 'Ашхабад' },
  { f: '🇲🇳', n: 'Монголия', cap: 'Улан-Батор' },
  { f: '🇹🇷', n: 'Турция', cap: 'Анкара' },
  { f: '🇮🇷', n: 'Иран', cap: 'Тегеран' },
  { f: '🇮🇶', n: 'Ирак', cap: 'Багдад' },
  { f: '🇮🇱', n: 'Израиль', cap: 'Иерусалим' },
  { f: '🇸🇦', n: 'Саудовская Аравия', cap: 'Эр-Рияд' },
  { f: '🇦🇪', n: 'ОАЭ', cap: 'Абу-Даби' },
  { f: '🇶🇦', n: 'Катар', cap: 'Доха' },
  { f: '🇦🇲', n: 'Армения', cap: 'Ереван' },
  { f: '🇬🇪', n: 'Грузия', cap: 'Тбилиси' },
  { f: '🇦🇿', n: 'Азербайджан', cap: 'Баку' },
  { f: '🇵🇰', n: 'Пакистан', cap: 'Исламабад' },
  { f: '🇦🇫', n: 'Афганистан', cap: 'Кабул' },
  { f: '🇧🇩', n: 'Бангладеш', cap: 'Дакка' },
  { f: '🇱🇰', n: 'Шри-Ланка', cap: 'Коломбо' },
  { f: '🇳🇵', n: 'Непал', cap: 'Катманду' },
  { f: '🇲🇲', n: 'Мьянма', cap: 'Нейпьидо' },
  { f: '🇰🇭', n: 'Камбоджа', cap: 'Пномпень' },
  { f: '🇱🇦', n: 'Лаос', cap: 'Вьентьян' },
  { f: '🇯🇴', n: 'Иордания', cap: 'Амман' },
  { f: '🇱🇧', n: 'Ливан', cap: 'Бейрут' },
  { f: '🇸🇾', n: 'Сирия', cap: 'Дамаск' },
  { f: '🇰🇼', n: 'Кувейт', cap: 'Эль-Кувейт' },

  { f: '🇪🇬', n: 'Египет', cap: 'Каир' },
  { f: '🇲🇦', n: 'Марокко', cap: 'Рабат' },
  { f: '🇩🇿', n: 'Алжир', cap: 'Алжир' },
  { f: '🇹🇳', n: 'Тунис', cap: 'Тунис' },
  { f: '🇱🇾', n: 'Ливия', cap: 'Триполи' },
  { f: '🇿🇦', n: 'ЮАР', cap: 'Претория' },
  { f: '🇳🇬', n: 'Нигерия', cap: 'Абуджа' },
  { f: '🇰🇪', n: 'Кения', cap: 'Найроби' },
  { f: '🇪🇹', n: 'Эфиопия', cap: 'Аддис-Абеба' },
  { f: '🇬🇭', n: 'Гана', cap: 'Аккра' },
  { f: '🇹🇿', n: 'Танзания', cap: 'Додома' },
  { f: '🇺🇬', n: 'Уганда', cap: 'Кампала' },
  { f: '🇦🇴', n: 'Ангола', cap: 'Луанда' },
  { f: '🇲🇿', n: 'Мозамбик', cap: 'Мапуту' },
  { f: '🇿🇼', n: 'Зимбабве', cap: 'Хараре' },
  { f: '🇿🇲', n: 'Замбия', cap: 'Лусака' },
  { f: '🇸🇳', n: 'Сенегал', cap: 'Дакар' },
  { f: '🇨🇲', n: 'Камерун', cap: 'Яунде' },
  { f: '🇲🇬', n: 'Мадагаскар', cap: 'Антананариву' },
  { f: '🇧🇼', n: 'Ботсвана', cap: 'Габороне' },

  { f: '🇺🇸', n: 'США', cap: 'Вашингтон' },
  { f: '🇨🇦', n: 'Канада', cap: 'Оттава' },
  { f: '🇲🇽', n: 'Мексика', cap: 'Мехико' },
  { f: '🇧🇷', n: 'Бразилия', cap: 'Бразилиа' },
  { f: '🇦🇷', n: 'Аргентина', cap: 'Буэнос-Айрес' },
  { f: '🇨🇱', n: 'Чили', cap: 'Сантьяго' },
  { f: '🇨🇴', n: 'Колумбия', cap: 'Богота' },
  { f: '🇵🇪', n: 'Перу', cap: 'Лима' },
  { f: '🇻🇪', n: 'Венесуэла', cap: 'Каракас' },
  { f: '🇪🇨', n: 'Эквадор', cap: 'Кито' },
  { f: '🇧🇴', n: 'Боливия', cap: 'Сукре' },
  { f: '🇵🇾', n: 'Парагвай', cap: 'Асунсьон' },
  { f: '🇺🇾', n: 'Уругвай', cap: 'Монтевидео' },
  { f: '🇨🇺', n: 'Куба', cap: 'Гавана' },
  { f: '🇯🇲', n: 'Ямайка', cap: 'Кингстон' },
  { f: '🇵🇦', n: 'Панама', cap: 'Панама' },
  { f: '🇨🇷', n: 'Коста-Рика', cap: 'Сан-Хосе' },
  { f: '🇬🇹', n: 'Гватемала', cap: 'Гватемала' },
  { f: '🇩🇴', n: 'Доминикана', cap: 'Санто-Доминго' },
  { f: '🇭🇳', n: 'Гондурас', cap: 'Тегусигальпа' },

  { f: '🇦🇺', n: 'Австралия', cap: 'Канберра' },
  { f: '🇳🇿', n: 'Новая Зеландия', cap: 'Веллингтон' },
  { f: '🇫🇯', n: 'Фиджи', cap: 'Сува' },
  { f: '🇵🇬', n: 'Папуа — Новая Гвинея', cap: 'Порт-Морсби' },
];

const ROUNDS = 10;

const STAR = (
  <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3 7.2 18.7l.9-5.4L4.2 8.7l5.4-.8z" />
);

type Question = { current: Country; names: Country[] };

export default function CountriesGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    text: string;
    kind: 'good' | 'bad';
  } | null>(null);
  const [finished, setFinished] = useState(false);
  const [starsOn, setStarsOn] = useState(0);
  const [popKey, setPopKey] = useState(0); // перезапуск pop-анимации флага
  const [question, setQuestion] = useState<Question | null>(null);
  const queue = useRef<Country[]>([]);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    syncWallet();
    next();
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);

  function next() {
    setLocked(false);
    setPicked(null);
    setToast(null);
    if (queue.current.length === 0) queue.current = shuffle(DATA);
    const current = queue.current.shift()!;
    const others = shuffle(DATA.filter((d) => d.n !== current.n));
    setQuestion({
      current,
      names: shuffle([current, others[0], others[1], others[2]]),
    });
    setPopKey((k) => k + 1);
  }

  function choose(o: Country) {
    if (locked || !question || finished) return;
    setLocked(true);
    setPicked(o.n);
    const correct = o.n === question.current.n;
    if (correct) {
      sfx(true);
      addCoins(1);
      setScore((s) => s + 1);
      setToast({
        text: 'Верно! Столица — ' + question.current.cap,
        kind: 'good',
      });
    } else {
      sfx(false);
      setToast({
        text:
          'Это ' + question.current.n + ' · столица ' + question.current.cap,
        kind: 'bad',
      });
    }
    const newRound = round + 1;
    setRound(newRound);
    timer.current = window.setTimeout(
      () => {
        if (newRound >= ROUNDS) finish(correct ? score + 1 : score);
        else next();
      },
      correct ? 1000 : 1600,
    );
  }

  function finish(finalScore: number) {
    setFinished(true);
    const stars =
      finalScore >= 10 ? 3 : finalScore >= 7 ? 2 : finalScore >= 4 ? 1 : 0;
    for (let i = 0; i < stars; i++) {
      setTimeout(() => setStarsOn(i + 1), 200 + i * 220);
    }
    if (stars >= 1)
      burstConfetti([
        '#7048e8',
        '#3b6cf6',
        '#12b886',
        '#ffd43b',
        '#ff5a7a',
        '#ff922b',
      ]);
    saveBest('countries', finalScore);
  }

  function again() {
    queue.current = [];
    setRound(0);
    setScore(0);
    setFinished(false);
    setStarsOn(0);
    next();
  }

  const endStars = score >= 10 ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0;

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
        <span className="title">Чей это флаг?</span>
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
            <i style={{ width: `${(round / ROUNDS) * 100}%` }} />
          </div>
        )}

        {!finished && question && (
          <div
            className="playing"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(16px,4vw,26px)',
            }}
          >
            <div className="lead">Угадай страну по флагу</div>
            <div key={popKey} className="flag pop">
              {question.current.f}
            </div>
            <div className={'toast' + (toast ? ' ' + toast.kind : '')}>
              {toast?.text ?? ''}
            </div>
            <div className="opts">
              {question.names.map((o) => (
                <button
                  key={o.n}
                  type="button"
                  disabled={locked}
                  className={
                    'opt' +
                    (locked && o.n === question.current.n ? ' correct' : '') +
                    (locked && picked === o.n && o.n !== question.current.n
                      ? ' wrong'
                      : '')
                  }
                  onClick={() => choose(o)}
                >
                  {o.n}
                </button>
              ))}
            </div>
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
                  stroke="none"
                >
                  {STAR}
                </svg>
              ))}
            </div>
            <div className="big">
              {endStars === 3
                ? 'Знаток флагов!'
                : endStars >= 1
                  ? 'Молодец!'
                  : 'Попробуй ещё!'}
            </div>
            <div className="res">
              Правильно {score} из {ROUNDS}
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
