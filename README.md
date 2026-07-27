# kids-games

Монорепозиторий детских развивающих игр «Играй и учись» (35 игр, 4–8 лет).

## Структура

- `frontend/` — веб-приложение на [Astro](https://astro.build) + React. Каждая игра — React-компонент (`src/games/<key>/`), отдаваемый через Astro-страницу (`src/pages/game-<key>.astro`). Общий код (кошелёк монеток, звуковые эффекты, конфетти, рекорды) — в `src/lib/`.
- `backend/` — сервис на Bun.

Workspace-пакеты перечислены в `pnpm-workspace.yaml`.

## Команды

```bash
pnpm install           # установка зависимостей всех workspace
pnpm dev               # dev-сервер frontend (http://localhost:4321)
pnpm build             # прод-сборка frontend
pnpm preview           # предпросмотр прод-сборки
pnpm dev:backend       # dev-сервер backend
```

## Как устроены игры

- Монетки: `iu:wallet` в localStorage (`e` — заработано, `s` — потрачено, `p` — купленные питомцы), см. `frontend/src/lib/wallet.ts`.
- Рекорды: `iu:best:<key>` в localStorage, показываются на карточках хаба.
- Возрастной фильтр: `iu:age` (`a` 3–4, `b` 5–6, `c` 7–8, `all`).
- Ассеты (фото животных, птиц, звуки и т.п.): `frontend/public/assets/`.
- Зоомагазин (`pet-shop`) использует Phaser (`frontend/public/vendor/phaser.min.js`).
