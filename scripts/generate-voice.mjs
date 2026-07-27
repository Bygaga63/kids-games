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
  ru: { voice: 'ru-RU-SvetlanaNeural', rate: '-10%' },
  'ru-letter': { voice: 'ru-RU-SvetlanaNeural', rate: '-25%' },
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
  'Озвучка сгенерирована edge-tts (нейроголоса Microsoft: ru-RU-SvetlanaNeural, en-US-JennyNeural).\n' +
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
