# AutoLife (рабочее название)

Кроссплатформенное мобильное приложение (Android + iOS) — **цифровая экосистема автомобиля**.
Помогает выявлять скрытые проблемы, хранит историю/документы, даёт ИИ-аналитику и поднимает
ценность авто при продаже. У каждой машины — цифровой «паспорт жизни», который остаётся с ней навсегда.

> Статус: **планирование**. Подробности — в [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) и [docs/ROADMAP.md](docs/ROADMAP.md).
> Название рабочее — легко переименуем (кандидаты: AutoLife, AutoScore, CarDNA).

## Стек

- **Mobile:** React Native + Expo (TypeScript), Expo Router, NativeWind, TanStack Query
- **Backend:** Node.js + Fastify, PostgreSQL + Prisma, pgvector, Redis/BullMQ
- **ИИ:** Claude API (Opus 4.8 — аналитика/скоринг, Sonnet 4.6 — чат 24/7)
- **Платежи:** RevenueCat · **Хранилище:** Cloudflare R2 / S3 · **Сборки/OTA:** Expo EAS
- **Монорепо:** pnpm workspaces + Turborepo

## Структура (план)

```
autolife/
  apps/
    mobile/    # React Native + Expo
    api/       # Fastify + Prisma
  packages/
    shared/    # общие типы, zod-схемы, база DTC-кодов
  docs/        # архитектура и роадмап
```

## Целевой рынок

РФ + Европа (признак — TÜV). Отсюда: мультиязычность (RU / EN / DE), GDPR,
высокая ценность сервисной истории на вторичном рынке.
