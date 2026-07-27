# Гайд по конвертации игр из HTML в React (Astro)

Источник: `/Users/bygaga/Library/Application Support/Open Design/namespaces/release-stable/data/projects/1746d8a3-8868-4a24-a63b-027c3d5582ac/game-<key>.html`
(самостоятельные HTML-страницы с инлайн-CSS и ванильным JS).

Образец конвертации: игра «Цвета» —

- `src/games/colors/ColorsGame.tsx`
- `src/games/colors/colors.css`
- `src/pages/game-colors.astro`

## Правила

1. **Структура на игру** (key — имя файла без `game-` и `.html`, напр. `letters-ru`):
   - `src/games/<key>/<PascalCase>Game.tsx` — default-export React-компонент со всей логикой.
   - `src/games/<key>/<key>.css` — CSS из `<style>` оригинала БЕЗ изменений селекторов
     (импортируется компонентом: `import './<key>.css'`). Каждая страница грузит только свой CSS,
     коллизии классов между играми не страшны.
   - `src/pages/game-<key>.astro` — страница: `BaseLayout` с оригинальным `<title>` + `<Component client:only="react" />`.

2. **Общий код — только из `src/lib/` (алиас `@lib/*`), не копировать в компонент:**
   - `@lib/wallet`: `addCoins(n)` (начисляет и показывает бейдж), `spendCoins(n)`, `loadWallet()/saveWallet()`, `coinBalance()`, `syncWallet()` (вызвать один раз в `useEffect` при монтировании — в оригинале это `_wSave(_wLoad())`).
   - `@lib/sfx`: `sfx(ok: boolean)` — звук верно/неверно; `speak(text)` — озвучка speechSynthesis (если в оригинале есть свой вариант с другими rate/pitch/выбором голоса — оставить свой в компоненте).
   - `@lib/random`: `shuffle`, `pick`, `rnd`.
   - `@lib/best`: `saveBest(key, score)`, `getBest(key)` — ключ брать из оригинала (`iu:best:<key>`).
   - `@lib/confetti`: `burstConfetti(colors?, count?)` — при этом блок `.confetti` из CSS оригинала удалить (стили инжектит либа).

3. **Конвертация логики**: DOM-манипуляции → React-состояние (`useState`/`useRef`/`useEffect`).
   Геймплей, тексты, тайминги, подсчёт звёзд и монеток сохранять 1:1.
   Таймеры чистить при размонтировании, где это просто (`useEffect` cleanup).

4. **Ссылки и пути**:
   - «Назад» / ссылки на хаб: `index.html` → `/`.
   - Ссылки на другие игры: `game-xxx.html` → `/game-xxx`.
   - Ассеты: `assets/...` → `/assets/...` (лежат в `frontend/public/assets/`).

5. **CSS**: копировать целиком, включая `:root` и `body` (страницы изолированы). Инлайн-атрибуты
   `style="..."` из HTML переводить в JSX-объекты. `data-od-id` атрибуты не переносить.

6. **TypeScript**: строгий tsconfig. Типизировать данные игр (массивы вопросов и т.д.) простыми
   type-алиасами. Без `any`, где несложно; допустим точечный `as` для Web API.

7. **Ничего не выдумывать**: тексты, эмодзи, данные (списки слов, вопросов, фактов) переносить
   дословно из оригинала.
