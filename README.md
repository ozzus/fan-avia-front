# Fan Avia Frontend

Простой фронтенд для Fan Avia: список ближайших матчей, карточка матча, 6 ценовых слотов перелета и ссылки на покупку билетов.

## Стек

- React 19
- Vite 7
- JS (FSD-ориентированная структура)
- Fetch API

## Структура

- `src/pages/home-page.jsx` — главная страница с ближайшими матчами.
- `src/pages/match-page.jsx` — детальная страница матча.
- `src/widgets/match-airfare-dashboard.jsx` — загрузка upcoming матчей + airfare.
- `src/entities/match/` — api + ui для матчей.
- `src/entities/airfare/` — api + ui для цен.
- `src/features/match-search/ui/` — форма выбора города вылета.
- `src/shared/ui/city-select.jsx` — поисковый dropdown города.
- `src/shared/lib/build-aviasales-link.js` — построение affiliate ссылок.

## Окружение (`.env.local`)

```env
VITE_TP_MARKER=688168
VITE_AVIASALES_BASE_URL=https://search.aviasales.com/flights/
VITE_AVIASALES_LOCALE=ru
VITE_AVIASALES_CURRENCY=RUB
```

## Установка и запуск

```bash
npm install
npm run dev
```

Фронт откроется на `http://localhost:5173`.

## Запуск вместе с backend

1. В репозитории `fan-avia` подними бэк:

```bash
docker compose up -d --build
```

2. В этом репозитории запусти фронт:

```bash
npm run dev
```

3. Открой:

- Front: `http://localhost:5173`
- API Gateway: `http://localhost:8080`
- Swagger UI: `http://localhost:8081`
- Jaeger: `http://localhost:16686`

`vite.config.js` уже проксирует `/v1` и `/healthz` на `http://localhost:8080`.

## Какие ручки использует фронт

- `GET /v1/matches/upcoming-with-airfare?limit=12&origin_iata=...`
- `GET /v1/matches/{match_id}`
- `GET /v1/matches/{match_id}/airfare?origin_iata=...`

## Как работает пользовательский сценарий

1. Пользователь выбирает город вылета (не IATA вручную).
2. Фронт маппит город в IATA и запрашивает upcoming матчи с best airfare summary.
3. По клику на матч грузятся 6 слотов цен и ссылка на билеты матча.
4. Кнопка `Best fare` и кнопки в слотах ведут по партнерской ссылке Aviasales (marker из `.env.local`).

## Команды

- `npm run dev` — dev сервер.
- `npm run build` — production build.
- `npm run preview` — локальный preview build.
- `npm run lint` — eslint.
