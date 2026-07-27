import type { ReactNode } from 'react';

export type AgeGroup = 'a' | 'b' | 'c';

/** Раздел хаба: основная сетка игр, «Загадки», «Зоомагазин». */
export type HubSection = 'games' | 'riddles' | 'shop';

export type HubCard = {
  key: string;
  href: string;
  title: string;
  desc: string;
  /** --c / --c2 карточки */
  c: string;
  c2: string;
  /** data-age; у карточки зоомагазина отсутствует (не фильтруется) */
  ages?: AgeGroup[];
  icon: ReactNode;
  section: HubSection;
};

export const HUB_CARDS: HubCard[] = [
  {
    key: 'colors',
    href: '/game-colors',
    title: 'Цвета',
    desc: 'Найди нужный цвет среди других. Учим названия цветов.',
    c: '#ff5a7a',
    c2: '#ff8aa3',
    ages: ['a', 'b'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3a9 9 0 1 0 0 18c1.7 0 2-1.3 1-2.3-1-1-.7-2.7 1-2.7h1.5A4.5 4.5 0 0 0 21 11.5C21 6.8 17 3 12 3z" />
        <circle cx="7.5" cy="11" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="11" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    key: 'letters-ru',
    href: '/game-letters-ru',
    title: 'Буквы (русский)',
    desc: 'Учим алфавит: слушаем букву и находим пару. Со звуком.',
    c: '#3b6cf6',
    c2: '#5b8cff',
    ages: ['a', 'b'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 19V7a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v12" />
        <path d="M6 13h6" />
        <path d="M16 4v15M16 4h2.5a2.5 2.5 0 0 1 0 5H16M16 9h3a2.5 2.5 0 0 1 0 5h-3" />
      </svg>
    ),
  },
  {
    key: 'numbers',
    href: '/game-numbers',
    title: 'Числа до 100',
    desc: 'Находи числа по порядку на скорость. Таблица Шульте.',
    c: '#12b886',
    c2: '#3ad29a',
    ages: ['b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 9h16M4 15h16M9 4 7.5 20M16.5 4 15 20" />
      </svg>
    ),
  },
  {
    key: 'math',
    href: '/game-math',
    title: 'Математика',
    desc: 'Сложение и вычитание. Выбирай правильный ответ.',
    c: '#f59f00',
    c2: '#ffc24b',
    ages: ['b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 7h6M8 4v6" />
        <path d="M14 6.5h5M14 9.5h5" />
        <path d="M16.5 14.5 19 17m0-2.5L16.5 17" />
        <path d="M5 16h6M5 18.5h6" />
      </svg>
    ),
  },
  {
    key: 'puzzle',
    href: '/game-puzzle',
    title: 'Пятнашки',
    desc: 'Собери числа по порядку, двигая костяшки. Логика.',
    c: '#e64980',
    c2: '#ff7ab0',
    ages: ['b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 4h4a0 0 0 0 1 0 0v2a1.5 1.5 0 0 0 3 0V4h3v3h-2a1.5 1.5 0 0 0 0 3h2v4h-2a1.5 1.5 0 0 1 0 3h2v3h-3v-2a1.5 1.5 0 0 0-3 0v2h-4v-3a1.5 1.5 0 0 0-3 0v0H4v-3h2a1.5 1.5 0 0 0 0-3H4V7h3a1.5 1.5 0 0 1 3 0z" />
      </svg>
    ),
  },
  {
    key: 'english',
    href: '/game-english',
    title: 'English',
    desc: 'Английский алфавит. Слушай и находи букву.',
    c: '#0c8599',
    c2: '#15aabf',
    ages: ['b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 8 5 9.5V20M10 7l-1 1v12M8 4l9-1v15l-9 1" />
        <path d="M17 3l2 1v13l-2 1" />
      </svg>
    ),
  },
  {
    key: 'animals',
    href: '/game-animals',
    title: 'Животные',
    desc: 'Кто как говорит и где живёт. Со звуком.',
    c: '#0ca678',
    c2: '#20c997',
    ages: ['a', 'b'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 14c0-3 2-5 4-5 1 0 1.5-2 3-2s2 2 3 2c2 0 4 2 4 5 0 2-1.5 3-3 3-1 0-1.5 1-2 1s-1-1-2-1-1 1-2 1-1-1-2-1c-1.5 0-3-1-3-3z" />
        <circle cx="9" cy="11" r=".8" fill="currentColor" stroke="none" />
        <circle cx="15" cy="11" r=".8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    key: 'countries',
    href: '/game-countries',
    title: 'Страны мира',
    desc: 'Чей это флаг? Угадываем страны и их столицы.',
    c: '#7048e8',
    c2: '#9775fa',
    ages: ['c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9z" />
      </svg>
    ),
  },
  {
    key: 'xo',
    href: '/game-xo',
    title: 'Крестики-нолики',
    desc: 'Поля 3×3 и 5×5. С другом или компьютером.',
    c: '#1098ad',
    c2: '#22b8cf',
    ages: ['b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
      </svg>
    ),
  },
  {
    key: 'jigsaw',
    href: '/game-jigsaw',
    title: 'Пазлы',
    desc: 'Собери картинку из кусочков. 3×3 и 4×4.',
    c: '#e8590c',
    c2: '#ff922b',
    ages: ['a', 'b'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    key: 'clock',
    href: '/game-clock',
    title: 'Часы',
    desc: 'Учим время: крути стрелки и ставь нужный час.',
    c: '#d6336c',
    c2: '#f06595',
    ages: ['b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5V12l3.2 2" />
      </svg>
    ),
  },
  {
    key: 'capitals',
    href: '/game-capitals',
    title: 'Столицы',
    desc: 'Назови столицу страны. 123 страны мира.',
    c: '#ae3ec9',
    c2: '#da77f2',
    ages: ['c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 21h18" />
        <path d="M5 21v-9M9.5 21v-9M14.5 21v-9M19 21v-9" />
        <path d="M3 12 12 5l9 7" />
        <path d="M12 5V3" />
      </svg>
    ),
  },
  {
    key: 'birds',
    href: '/game-birds',
    title: 'Перелётные птицы',
    desc: 'Кто улетает на юг, а кто зимует? Птицы России.',
    c: '#66a80f',
    c2: '#94d82d',
    ages: ['b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.2 4.8c-2.6-2.6-7-2-9.8.8L5 11c-1.5 1.5-2 5-2 8 3 0 6.5-.5 8-2l5.4-5.4c2.8-2.8 3.4-7.2.8-9.8z" />
        <path d="M16 8 4 20" />
      </svg>
    ),
  },
  {
    key: 'add10',
    href: '/game-add-10',
    title: 'Сложение до 10',
    desc: 'Реши пример и набери ответ сам. С подсказкой-кружочками.',
    c: '#f76707',
    c2: '#ff922b',
    ages: ['b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    key: 'sub10',
    href: '/game-sub-10',
    title: 'Вычитание до 10',
    desc: 'Сколько останется? Набери ответ на кнопках.',
    c: '#1971c2',
    c2: '#4dabf7',
    ages: ['b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
  {
    key: 'story',
    href: '/game-story',
    title: 'Создай историю',
    desc: 'Рулетка выберет 8 картинок — сочини по ним сказку.',
    c: '#5f3dc4',
    c2: '#845ef7',
    ages: ['a', 'b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 6c-2-1.5-4.5-2-8-2v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2V4c-3.5 0-6 .5-8 2z" />
        <path d="M12 6v14" />
      </svg>
    ),
  },
  {
    key: 'fruitveg',
    href: '/game-fruit-veg',
    title: 'Фрукт или овощ?',
    desc: 'Что растёт в саду, а что на грядке? С фактами.',
    c: '#e03131',
    c2: '#ff8787',
    ages: ['a', 'b'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 7.5c-1.2-2.6-4.8-3-6.6-.6-2 2.6-1.4 7.3 1.1 10.6 1.6 2.1 3.1 2.6 4.7 1.6.5-.3 1.1-.3 1.6 0 1.6 1 3.1.5 4.7-1.6 2.5-3.3 3.1-8 1.1-10.6-1.8-2.4-5.4-2-6.6.6z" />
        <path d="M12 7.5C12 5.5 13 4 15 3.5" />
      </svg>
    ),
  },
  {
    key: 'emotions',
    href: '/game-emotions',
    title: 'Отгадай эмоцию',
    desc: 'Что чувствует человечек? Учимся понимать эмоции.',
    c: '#be4bdb',
    c2: '#e599f7',
    ages: ['a', 'b'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 14.2c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8" />
        <path d="M9 9.6h.01M15 9.6h.01" strokeWidth="2.6" />
      </svg>
    ),
  },
  {
    key: 'predators',
    href: '/game-herbivore-predator',
    title: 'Травоядные или хищники',
    desc: 'Кто ест траву, а кто охотится? С фактами-сюрпризами.',
    c: '#2f9e44',
    c2: '#69db7c',
    ages: ['b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="7.2" cy="7.6" r="1.5" />
        <circle cx="12" cy="6.4" r="1.5" />
        <circle cx="16.8" cy="7.6" r="1.5" />
        <path d="M12 11c-3.1 0-5.6 2.3-5.6 4.8 0 1.7 1.3 3 2.9 3 1 0 1.8-.4 2.7-.4s1.7.4 2.7.4c1.6 0 2.9-1.3 2.9-3 0-2.5-2.5-4.8-5.6-4.8z" />
      </svg>
    ),
  },
  {
    key: 'domestic',
    href: '/game-domestic-wild',
    title: 'Домашние или дикие',
    desc: 'Кто живёт с человеком, а кто в лесу? С фактами.',
    c: '#e67700',
    c2: '#ffc078',
    ages: ['a', 'b'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 11 12 4l8 7" />
        <path d="M6 10v9h12v-9" />
        <path d="M10 19v-5h4v5" />
      </svg>
    ),
  },
  {
    key: 'seasons',
    href: '/game-seasons',
    title: 'Времена года',
    desc: 'Угадай сезон по настоящей фотографии.',
    c: '#0b7285',
    c2: '#3bc9db',
    ages: ['a', 'b'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M19.5 4.5l-1.8 1.8M6.3 17.7l-1.8 1.8" />
      </svg>
    ),
  },
  {
    key: 'flowers',
    href: '/game-flowers',
    title: 'Что это за цветок?',
    desc: 'Угадай цветок по фото. Цветы России.',
    c: '#c2255c',
    c2: '#faa2c1',
    ages: ['b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="2.6" />
        <path d="M12 9.4c-2.2 0-3.4-1.5-3.4-3 0-1.4 1.3-2.6 3.4-2.6s3.4 1.2 3.4 2.6c0 1.5-1.2 3-3.4 3zM12 14.6c2.2 0 3.4 1.5 3.4 3 0 1.4-1.3 2.6-3.4 2.6s-3.4-1.2-3.4-2.6c0-1.5 1.2-3 3.4-3zM9.4 12c0-2.2-1.5-3.4-3-3.4-1.4 0-2.6 1.3-2.6 3.4s1.2 3.4 2.6 3.4c1.5 0 3-1.2 3-3.4zM14.6 12c0 2.2 1.5 3.4 3 3.4 1.4 0 2.6-1.3 2.6-3.4s-1.2-3.4-2.6-3.4c-1.5 0-3 1.2-3 3.4z" />
      </svg>
    ),
  },
  {
    key: 'trees',
    href: '/game-trees',
    title: 'Что это за дерево?',
    desc: 'Угадай дерево по фото. Деревья России.',
    c: '#087f5b',
    c2: '#55d0ac',
    ages: ['b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3a6.5 6.5 0 0 1 6.5 6.5c0 3.6-2.9 6.5-6.5 6.5S5.5 13.1 5.5 9.5A6.5 6.5 0 0 1 12 3z" />
        <path d="M12 16v5M9 21h6" />
      </svg>
    ),
  },
  {
    key: 'tales-pic',
    href: '/game-tales-photo',
    title: 'Кто на картинке?',
    desc: 'Узнай героя сказки на классической картине.',
    c: '#862e9c',
    c2: '#cc5de8',
    ages: ['b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
        <path d="M3.5 15.5 8.5 11l4 4 3-2.5 4.5 3.5" />
        <circle cx="9" cy="9" r="1.3" />
      </svg>
    ),
  },
  {
    key: 'cartoons',
    href: '/game-cartoons',
    title: 'Кто из мультика?',
    desc: 'Узнай героев любимых мультфильмов.',
    c: '#1c7ed6',
    c2: '#74c0fc',
    ages: ['a', 'b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3.5" y="6" width="17" height="13" rx="2.5" />
        <path d="M3.5 10.5h17M8 6l2.4 4.5M13 6l2.4 4.5" />
      </svg>
    ),
  },
  {
    key: 'pattern',
    href: '/game-pattern',
    title: 'Сложи узор',
    desc: 'Кубики Никитина: собери узор из уголков и цветов.',
    c: '#339af0',
    c2: '#74c0fc',
    ages: ['a', 'b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect
          x="12.9"
          y="12.9"
          width="7.2"
          height="7.2"
          rx="1.5"
          transform="rotate(45 16.5 16.5)"
        />
      </svg>
    ),
  },
  {
    key: 'memo',
    href: '/game-memo',
    title: 'Мемо с животными',
    desc: 'Найди пары зверей по памяти. Настоящие фото.',
    c: '#0ca678',
    c2: '#38d9a9',
    ages: ['a', 'b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3.5" y="7" width="10.5" height="13.5" rx="2" />
        <path d="M8.5 4H18a2.5 2.5 0 0 1 2.5 2.5V17" />
        <path
          d="M6.8 12.2h.01M10.7 12.2h.01M8.75 16.2c.7.8 2 .8 2.7 0"
          strokeWidth="2.2"
        />
      </svg>
    ),
  },
  {
    key: 'odd',
    href: '/game-odd-one-out',
    title: 'Убери лишнее',
    desc: 'Три картинки дружат, одна — лишняя. Найди её!',
    c: '#f59f00',
    c2: '#ffd43b',
    ages: ['a', 'b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="7" cy="7" r="2.7" />
        <circle cx="17" cy="7" r="2.7" />
        <circle cx="7" cy="17" r="2.7" />
        <path d="M17 13.9 20.1 17 17 20.1 13.9 17z" />
      </svg>
    ),
  },
  {
    key: 'shapes',
    href: '/game-shapes',
    title: 'Учим фигуры',
    desc: 'Круг, квадрат, ромб и звезда. С запоминалками.',
    c: '#fa5252',
    c2: '#ffa8a8',
    ages: ['a', 'b'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="7.5" cy="7.5" r="3.5" />
        <rect x="13.5" y="4" width="7" height="7" rx="1.5" />
        <path d="M7.5 13.5 11 20H4z" />
        <path d="M17 13.5l3.5 3.5-3.5 3.5-3.5-3.5z" />
      </svg>
    ),
  },
  {
    key: 'sequence',
    href: '/game-sequence',
    title: 'Продолжи ряд',
    desc: 'Звезда, квадрат, круг… Что идёт дальше?',
    c: '#7950f2',
    c2: '#b197fc',
    ages: ['a', 'b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="5.4" cy="12" r="2.3" />
        <rect x="9.8" y="9.7" width="4.6" height="4.6" rx="1" />
        <path d="M18.2 9.5 20.7 12l-2.5 2.5" />
      </svg>
    ),
  },
  {
    key: 'whatnext',
    href: '/game-what-next',
    title: 'Что дальше?',
    desc: 'Семечко, росток, цветок… Продолжи историю!',
    c: '#5c940d',
    c2: '#a9e34b',
    ages: ['a', 'b'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 21v-8" />
        <path d="M12 13c0-4-3-6.5-7-6.5 0 4 3 6.5 7 6.5z" />
        <path d="M12 11c0-3.5 2.5-5.5 6-5.5 0 3.5-2.5 5.5-6 5.5z" />
      </svg>
    ),
  },
  {
    key: 'rebus',
    href: '/game-rebus',
    title: 'Ребусы',
    desc: 'Картинка плюс буквы: РАК + ЕТА = ракета!',
    c: '#e8590c',
    c2: '#ffa94d',
    ages: ['b', 'c'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="6.5" width="9" height="9" rx="2" />
        <path d="M15 11h6M18 8v6" />
        <circle cx="6.2" cy="9.8" r="1" fill="currentColor" stroke="none" />
        <path d="M3 13.5 6.5 11l3 2.5" />
      </svg>
    ),
  },
  {
    key: 'shop',
    href: '/game-shop',
    title: 'Продуктовый магазин',
    desc: 'Голос просит найти продукты — собери все покупки!',
    c: '#f08c00',
    c2: '#ffc078',
    ages: ['a', 'b'],
    section: 'games',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 9h14l-1.5 9.5a2 2 0 0 1-2 1.5h-7a2 2 0 0 1-2-1.5z" />
        <path d="M8.5 9 12 3.5 15.5 9" />
        <path d="M10 13v4M14 13v4" />
      </svg>
    ),
  },

  // ---- раздел «Загадки» ----
  {
    key: 'tales',
    href: '/game-tales',
    title: 'Угадай героя',
    desc: 'Загадки про героев русских сказок. С озвучкой.',
    c: '#a61e4d',
    c2: '#f06595',
    ages: ['b', 'c'],
    section: 'riddles',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 17l1.6-9L9 12l3-7.5L15 12l4.4-4L21 17z" />
        <path d="M5 20.5h14" />
      </svg>
    ),
  },
  {
    key: 'body',
    href: '/game-body',
    title: 'Части тела',
    desc: 'Загадки про глаза, уши и сердце. С озвучкой.',
    c: '#d9480f',
    c2: '#ff922b',
    ages: ['a', 'b'],
    section: 'riddles',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="5" r="2.4" />
        <path d="M12 7.5V15M12 15l-3.2 6M12 15l3.2 6M5.5 10.5 12 9l6.5 1.5" />
      </svg>
    ),
  },

  // ---- раздел «Зоомагазин» ----
  {
    key: 'petshop',
    href: '/pet-shop',
    title: 'Зоомагазин',
    desc: 'Питомцы разных пород, еда и вещи — за монетки из игр!',
    c: '#f59f00',
    c2: '#ffd43b',
    section: 'shop',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="7.2" cy="7.6" r="1.5" />
        <circle cx="12" cy="6.4" r="1.5" />
        <circle cx="16.8" cy="7.6" r="1.5" />
        <path d="M12 11c-3.1 0-5.6 2.3-5.6 4.8 0 1.7 1.3 3 2.9 3 1 0 1.8-.4 2.7-.4s1.7.4 2.7.4c1.6 0 2.9-1.3 2.9-3 0-2.5-2.5-4.8-5.6-4.8z" />
      </svg>
    ),
  },
];
