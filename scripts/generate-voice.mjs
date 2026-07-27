#!/usr/bin/env node
// Генерация озвучки нейронным TTS (edge-tts через `uvx`, бесплатные голоса Microsoft).
//
// Скрипт сам извлекает все озвучиваемые фразы из исходников игр, считает
// детерминированное имя файла (hash голос|скорость|текст — та же функция, что в
// frontend/src/lib/voice.ts) и генерирует недостающие mp3 в
// frontend/public/assets/voice/. Уже существующие файлы пропускаются.
//
// Запуск:  node scripts/generate-voice.mjs        (нужен установленный uv)
//          node scripts/generate-voice.mjs --force  — перегенерировать всё

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  unlinkSync,
} from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GAMES = join(ROOT, 'frontend/src/games');
const OUT = join(ROOT, 'frontend/public/assets/voice');
const FORCE = process.argv.includes('--force');

// ВАЖНО: голоса и скорости должны совпадать с PRESETS в frontend/src/lib/voice.ts
const PRESETS = {
  ru: { voice: 'ru-RU-DmitryNeural', rate: '-10%' },
  'ru-letter': { voice: 'ru-RU-DmitryNeural', rate: '-25%' },
  'en-letter': { voice: 'en-US-JennyNeural', rate: '-25%' },
};

function voiceSlug(s) {
  let h1 = 5381;
  let h2 = 52711;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1, 33) ^ c;
    h2 = Math.imul(h2, 33) ^ c;
  }
  return (h1 >>> 0).toString(36) + '-' + (h2 >>> 0).toString(36);
}

const src = (p) => readFileSync(join(GAMES, p), 'utf8');
const all = (text, re) => [...text.matchAll(re)].map((m) => m[1]);

/** @type {{text: string, kind: keyof typeof PRESETS, from: string}[]} */
const phrases = [];
const add = (text, kind, from) => phrases.push({ text, kind, from });

// --- Буквы (русский и английский алфавит, по одной букве) ---
const lettersRu = src('letters-ru/LettersRuGame.tsx').match(
  /const ALPHA = '([^']+)'/,
)[1];
for (const ch of lettersRu.split('')) add(ch, 'ru-letter', 'letters-ru');

const lettersEn = src('english/EnglishGame.tsx').match(
  /const ALPHA = '([^']+)'/,
)[1];
for (const ch of lettersEn.split('')) add(ch, 'en-letter', 'english');

// --- Животные: название (кнопка-динамик) и звук (при верном ответе) ---
const animals = src('animals/AnimalsGame.tsx');
for (const n of all(animals, /n:\s*'([^']+)'/g)) add(n, 'ru', 'animals');
for (const s of all(animals, /say:\s*'([^']+)'/g)) add(s, 'ru', 'animals');

// --- Магазин: «Найди <товар>» + финальная фраза ---
const shop = src('shop/ShopGame.tsx');
for (const acc of all(shop, /acc:\s*'([^']+)'/g))
  add('Найди ' + acc, 'ru', 'shop');
add('Молодец! Все покупки собраны!', 'ru', 'shop');

// --- Загадки: сказки и части тела ---
for (const r of all(src('tales/TalesGame.tsx'), /riddle:\s*'([^']+)'/g))
  add(r, 'ru', 'tales');
for (const r of all(src('body/BodyGame.tsx'), /riddle:\s*'([^']+)'/g))
  add(r, 'ru', 'body');

// --- Зоомагазин: кормёжка, покупки, голоса, уровень ---
const petShop = src('pet-shop/PetShopPage.tsx');
const between = (from, to) =>
  petShop.slice(petShop.indexOf(from), petShop.indexOf(to));
const foodNames = all(between('const FOOD', 'const THINGS'), /n:\s*'([^']+)'/g);
for (const n of foodNames) {
  add('Ням-ням! Обожаю ' + n.toLowerCase() + '!', 'ru', 'pet-shop');
  add('Ням-ням! Спасибо за ' + n.toLowerCase() + '!', 'ru', 'pet-shop');
}
const petNames = all(between('const PETS', 'const FOOD'), /n:\s*'([^']+)'/g);
for (const n of petNames)
  add('Ура! У тебя новый друг — ' + n.toLowerCase() + '!', 'ru', 'pet-shop');
const thingNames = all(
  between('const THINGS', 'const LEGACY'),
  /n:\s*'([^']+)'/g,
);
for (const n of thingNames)
  add(
    'Класс! Теперь в комнате есть ' + n.toLowerCase() + '!',
    'ru',
    'pet-shop',
  );
for (const v of all(
  between('const VOICES', 'function petVoice'),
  /: '([^']+)'/g,
))
  add(v, 'ru', 'pet-shop');
add('Привет!', 'ru', 'pet-shop');
add('Ура! Новый уровень!', 'ru', 'pet-shop');

// --- Мамы и малыши: вопрос и подсказка при ошибке ---
const babies = src('babies/BabiesGame.tsx');
const babyGens = all(babies, /babyGen:\s*'([^']+)'/g);
const moms = all(babies, /mom:\s*'([^']+)'/g);
if (babyGens.length !== moms.length)
  throw new Error('babies: babyGen/mom рассинхронизированы');
babyGens.forEach((bg, i) => {
  add('Кто мама у ' + bg + '?', 'ru', 'babies');
  add('Мама у ' + bg + ' — ' + moms[i].toLowerCase(), 'ru', 'babies');
});

// --- Счёт по порядку: подсказки уровней ---
for (const s of all(src('count-order/CountOrderGame.tsx'), /say:\s*'([^']+)'/g))
  add(s, 'ru', 'count-order');

// --- Посчитай: «Сколько <кого>?» ---
for (const m of all(src('counting/CountingGame.tsx'), /many:\s*'([^']+)'/g))
  add('Сколько ' + m + '?', 'ru', 'counting');

// --- Точки: название фигуры (без «!») ---
for (const n of all(src('dots/DotsGame.tsx'), /name:\s*'([^']+)'/g))
  add(n.replace('!', ''), 'ru', 'dots');

// --- Кто что ест: «Чем угостим <кого>?» ---
for (const t of all(src('eats/EatsGame.tsx'), /to:\s*'([^']+)'/g))
  add('Чем угостим ' + t + '?', 'ru', 'eats');

// --- Первая буква: названия слов ---
for (const n of all(src('first-letter/FirstLetterGame.tsx'), /n:\s*'([^']+)'/g))
  add(n, 'ru', 'first-letter');

// --- Насекомые: два вида вопросов + факты ---
const insects = src('insects/InsectsGame.tsx');
for (const n of all(insects, /n:\s*'([^']+)'/g)) {
  add('Найди, где ' + n.toLowerCase(), 'ru', 'insects');
  add(n + '. Это насекомое?', 'ru', 'insects');
}
for (const f of all(insects, /fact:\s*'([^']+)'/g)) add(f, 'ru', 'insects');

// --- Грибы: факты + напоминание о безопасности ---
const mushrooms = src('mushrooms/MushroomsGame.tsx');
for (const f of all(mushrooms, /fact:\s*'([^']+)'/g)) add(f, 'ru', 'mushrooms');
add(mushrooms.match(/const SAFETY = '([^']+)'/)[1], 'ru', 'mushrooms');

// --- Профессии: «Кто <что делает>?» + вопрос про предмет ---
for (const d of all(src('professions/ProfessionsGame.tsx'), /d:\s*'([^']+)'/g))
  add('Кто ' + d + '?', 'ru', 'professions');
add('Кому нужен этот предмет?', 'ru', 'professions');

// --- Тени: «Найди тень. <кто>» + название ---
for (const n of all(src('shadow/ShadowGame.tsx'), /n:\s*'([^']+)'/g)) {
  add('Найди тень. ' + n, 'ru', 'shadow');
  add(n, 'ru', 'shadow');
}

// --- Размеры: две просьбы ---
const sizes = src('sizes/SizesGame.tsx');
add(sizes.match(/const ASK_UP = '([^']+)'/)[1], 'ru', 'sizes');
add(sizes.match(/const ASK_DOWN = '([^']+)'/)[1], 'ru', 'sizes');

// --- Транспорт: «Найди <что>» + название ---
const transport = src('transport/TransportGame.tsx');
const tNames = all(transport, /n:\s*'([^']+)'/g);
const tAccs = all(transport, /acc:\s*'([^']+)'/g);
for (const n of tNames) add(n, 'ru', 'transport');
for (const a of tAccs) add('Найди ' + a, 'ru', 'transport');

// --- дедупликация и план генерации ---
const seen = new Set();
const plan = [];
for (const p of phrases) {
  const preset = PRESETS[p.kind];
  const key = preset.voice + '|' + preset.rate + '|' + p.text;
  if (seen.has(key)) continue;
  seen.add(key);
  plan.push({ ...p, ...preset, file: voiceSlug(key) + '.mp3' });
}

mkdirSync(OUT, { recursive: true });
const todo = plan.filter((p) => FORCE || !existsSync(join(OUT, p.file)));
console.log(`Фраз всего: ${plan.length}, генерировать: ${todo.length}`);

function generate(p) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'uvx',
      [
        'edge-tts',
        '--voice',
        p.voice,
        `--rate=${p.rate}`,
        '--text',
        p.text,
        '--write-media',
        join(OUT, p.file),
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );
    let err = '';
    child.stderr.on('data', (d) => (err += d));
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(`edge-tts (${p.text.slice(0, 30)}…): ${err.trim()}`),
          ),
    );
  });
}

const POOL = 6;
let done = 0;
const failed = [];
const queue = [...todo];
await Promise.all(
  Array.from({ length: POOL }, async () => {
    for (let p = queue.shift(); p; p = queue.shift()) {
      try {
        await generate(p);
      } catch (e) {
        failed.push(p);
        console.error('FAIL', e.message);
        try {
          unlinkSync(join(OUT, p.file)); // не оставляем пустой файл
        } catch {}
      }
      done++;
      if (done % 20 === 0) console.log(`  ${done}/${todo.length}…`);
    }
  }),
);

// манифест для отладки: какой файл — какая фраза
const manifest = Object.fromEntries(
  plan
    .slice()
    .sort(
      (a, b) => a.from.localeCompare(b.from) || a.text.localeCompare(b.text),
    )
    .map((p) => [
      p.file,
      { text: p.text, voice: p.voice, rate: p.rate, from: p.from },
    ]),
);
writeFileSync(
  join(OUT, 'manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
writeFileSync(
  join(OUT, 'credits.txt'),
  'Озвучка сгенерирована edge-tts (нейроголоса Microsoft: ru-RU-DmitryNeural, en-US-JennyNeural).\n' +
    'Файлы именуются hash(голос|скорость|текст) — см. scripts/generate-voice.mjs и frontend/src/lib/voice.ts.\n' +
    'Перегенерация: node scripts/generate-voice.mjs\n',
);

// осиротевшие клипы (фразу изменили в игре) — подсказываем удалить
const known = new Set(plan.map((p) => p.file));
const orphans = readdirSync(OUT).filter(
  (f) => f.endsWith('.mp3') && !known.has(f),
);
if (orphans.length)
  console.log(
    `Осиротевших клипов: ${orphans.length} (можно удалить): ${orphans.join(', ')}`,
  );

console.log(failed.length ? `Готово с ошибками: ${failed.length}` : 'Готово.');
process.exit(failed.length ? 1 : 0);
