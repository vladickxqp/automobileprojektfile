# AutoLife — Архитектура

## 1. Видение и северная звезда

Главная идея — **не сервисная книжка и не OBD**, а **цифровая история жизни автомобиля**:
автомобильный аналог медицинской карты человека. Кульминация — **CarDNA (#40)**: единое досье
машины, которое живёт **между владельцами** и отвечает на вопросы «что ломалось / сколько вложено /
насколько надёжна / сколько ещё прослужит / стоит ли покупать / сколько реально стоит».

Это требование переворачивает архитектуру: данные принадлежат **автомобилю**, а не пользователю.

**Целевой рынок:** РФ + Европа (TÜV → Германия) → RU / EN / DE + GDPR.

---

## 2. Архитектурный костяк (вокруг CarDNA)

Закладывается в Phase 0, даже несмотря на то что CarDNA выходит в V4. Иначе потом не переделать.

### 2.1. Идентичность машины — VIN, а не пользователь
`Vehicle` идентифицируется по **VIN** (уникальный, неизменный). Вся история (обслуживание,
сканы, расходы, скоры, фото) привязана к `Vehicle`, не к `User`. Машина переживает смену владельца.

### 2.2. Владение — отдельная временна́я связь
`Ownership(vehicleId, userId, role, from, to)`. У авто может быть цепочка владельцев; досье
сохраняется. Это и есть фундамент CarDNA и «проверки объявлений» (#29) / «подбора перед покупкой» (#28).

### 2.3. Событийная лента — спина CarDNA и будущего ML
Всё, что происходит с авто (ТО, ремонт, OBD-скан, расход, документ, инцидент, снимок AutoScore),
пишется в **append-only `VehicleEvent`** с `occurredAt`, `mileage`, `payload`, `visibility`.
Это «медкарта» машины: чистая структурированная лента = топливо для предсказаний (#35–38),
остаточного ресурса (#36–37) и базы надёжности (#34).

### 2.4. Два слоя данных (решает приватность при передаче)
- **CarDNA-слой** (`visibility = carDNA`) — события, описывающие состояние/историю машины.
  Переносятся новому владельцу и попадают в отчёт о продаже.
- **Приватный слой** (`visibility = private`) — личные документы, страховки, чеки с перс. данными.
  **Не** передаются автоматически; владелец сам решает, что опубликовать в досье.

Отчёт для продажи (#14) и CarDNA — это **курируемый срез CarDNA-слоя**, без перс. данных владельца.

---

## 3. Технологический стек

### Клиент: React Native + Expo (TypeScript)
Один язык с бэком · OTA-обновления (Expo Updates) без ревью сторов · `react-native-ble-plx` под
OBD-II · крупнейшая экосистема + EAS · New Architecture.

| Слой | Выбор |
|------|-------|
| Навигация | Expo Router |
| Серверные данные / кеш | TanStack Query |
| Локальный стейт | Zustand |
| Offline-first | expo-sqlite (+ синхронизация; на масштабе WatermelonDB / PowerSync) |
| Bluetooth / OBD-II | react-native-ble-plx |
| Камера / сканы / фото-анализ (#18) | expo-camera / vision-camera |
| Хранение токенов | expo-secure-store |
| Пуши / напоминания (#8) | expo-notifications |
| Формы / валидация | react-hook-form + zod |
| UI | NativeWind + дизайн-система, иконки lucide |
| i18n (#16) | i18next (RU / EN / DE) |
| Сборки / OTA | Expo EAS + expo-updates |

### Backend (API)

| Слой | Выбор |
|------|-------|
| Рантайм | Node.js + TypeScript, Fastify |
| БД | PostgreSQL + Prisma |
| Векторный поиск (RAG) | pgvector |
| Файлы | S3-совместимое: Cloudflare R2 / AWS S3 |
| Очереди / фон | BullMQ + Redis (отчёты, пересчёт скоров, OCR) |
| Аутентификация (#1) | JWT + refresh, Sign in with Apple / Google |
| Платежи / подписки | RevenueCat |
| ИИ | Claude — Opus 4.8 (аналитика/скоринг), Sonnet 4.6 (чат) |

### Инфраструктура
- **Монорепо:** pnpm + Turborepo → `apps/mobile`, `apps/api`, `packages/shared`
- **Хостинг:** Railway / Fly.io + Cloudflare R2
- **Наблюдаемость:** Sentry (mobile + backend)
- **CI/CD:** GitHub Actions + EAS

---

## 4. OBD-II слой (#11, #12) — ключевой технический риск

- ELM327 общается AT-командами по последовательному каналу.
- **Android:** BT Classic (SPP) и BLE. **iOS:** только **BLE** (или WiFi) — классические клоны на iOS не работают.
- **База:** BLE ELM327 (обе платформы); WiFi — опционально. В онбординге — список совместимых адаптеров.
- Нужна база DTC-кодов (`P0401 = недостаточный поток EGR`) + стандартные PID (обороты, темп. ОЖ, нагрузка).
- Чистая абстракция: `Transport (BLE/WiFi)` → `ELM327` → `OBD команда/ответ` → `доменная модель`.

---

## 5. ИИ-слой (по версиям)

| Фича | Подход |
|------|--------|
| #10 Ассистент по симптомам | Claude Sonnet + RAG (pgvector) над базой знаний; контекст = данные конкретного авто |
| #13 AutoScore | MVP: правила + знание модели Claude (история ТО, пробег/возраст, DTC, расходы) → 1–100 с прозрачной разбивкой. V4: ML на накопленных событиях |
| #18 Анализ фото неисправностей (V2) | Claude multimodal (vision) по снимку детали/узла |
| #19 Анализ звуков двигателя (V2) | ⚠️ Отдельная аудио-ML задача (классификация), не Claude напрямую — требует исследования/спец-модели |
| #22 Калькулятор ремонта (V2) | Claude + прайс-данные запчастей/работ |
| #35–38 Предсказание поломок / ресурс (V4) | ML на событийной ленте + база надёжности #34; Claude — для объяснений |

Безопасность ответов: дисклеймеры (не заменяет СТО), без заведомо опасных рекомендаций.

---

## 6. Модель данных (костяк)

```
User                — id, email, authProvider, locale, subscriptionTier
Vehicle             — id, VIN(unique), make, model, year, engine, plate, photoUrl   ← идентичность машины
Ownership           — vehicleId, userId, role[owner|viewer], from, to               ← цепочка владельцев
VehicleEvent        — vehicleId, type[maintenance|repair|scan|expense|document|incident|score],
                      occurredAt, mileage, payload(json), visibility[private|carDNA], createdByUserId
                      ← append-only лента: спина CarDNA и ML
MaintenanceRecord   — детализация события ТО/ремонта (parts, shop, cost, attachments[])
Document            — vehicleId, type[insurance|techpassport|TÜV|invoice|contract], fileUrl,
                      issuedAt, expiresAt   ← напоминания (#8)
Expense             — vehicleId, category, amount, date   (#9)
DiagnosticScan      — vehicleId, timestamp, adapterInfo, dtcCodes[]   (#11)
DtcCodeRef          — code, description, severity, system   (справочник, #12)
Photo               — vehicleId, url, category[accident|general|parts], takenAt, geo
InsuranceCase       — vehicleId, date, type, description, photos[], documents[], status   (#24, V2)
ReliabilityScore    — vehicleId, computedAt, score, breakdown(json)   (#13 AutoScore-снимки)
SaleReport          — vehicleId, publicSlug, snapshot(json из CarDNA-слоя), expiresAt   (#14)
KnowledgeChunk      — embedding(vector), source, text   (RAG, #10/#27)
Subscription        — userId, tier, store, status, renewsAt
```

---

## 7. Данные под будущий ML (#34–38) — почему это важно уже в MVP

Предсказание поломок, остаточный ресурс и база надёжности живут на **чистых структурированных
событиях**. Поэтому с MVP:
- всё пишем в нормализованную `VehicleEvent`-ленту (не в свободный текст);
- `mileage` и `occurredAt` обязательны у событий — это оси для трендов и прогнозов;
- **никаких фейковых данных** — база надёжности растёт только из реальных событий;
  холодный старт #34 закрываем публичными датасетами (DTC, отзывные кампании) + знанием Claude.

---

## 8. Внешние интеграции (V2+)

- **Запчасти и цены (#20, #21):** каталоги/прайс-агрегаторы запчастей (API).
- **Ближайшие сервисы (#23):** Maps/Places API + геолокация.
- **Маркетплейсы (#32, #33):** контент-модель + модерация (V3).
- **Проверка объявлений (#29):** сопоставление VIN с CarDNA-досье.

---

## 9. Безопасность и приватность

- **GDPR:** согласия, экспорт и удаление данных по запросу.
- Шифрование файлов в покое (S3 SSE), токены — в Secure Store / Keychain.
- **Передача между владельцами:** переносится только CarDNA-слой; приватный слой остаётся у прежнего владельца.
- Публичный отчёт о продаже — подписанная ссылка с экспирацией, без перс. данных владельца.
