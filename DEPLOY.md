# CarDNA — Backend in die Cloud (Render)

Damit läuft die echte API + eine echte Postgres-Datenbank 24/7 in der Cloud. Danach kann die App
(Web oder Handy) mit echten Daten statt dem Demo-Modus arbeiten.

> Ich (Claude) kann den Account nicht anlegen und den Deploy-Knopf nicht für dich drücken — das ist
> dein Konto/deine Abrechnung. Alles drumherum ist vorbereitet, sodass es nur Klicken ist.

---

## 1. Deploy auf Render (empfohlen, ~5 Min.)

Die Datei [`render.yaml`](render.yaml) ist ein **Blueprint**: Render erstellt daraus automatisch die
Postgres-DB **und** den API-Service aus dem [`Dockerfile`](Dockerfile), verbindet `DATABASE_URL`
selbst und generiert ein `JWT_SECRET`.

1. Konto auf <https://render.com> anlegen und mit GitHub verbinden.
2. **New ▸ Blueprint** → dieses Repo (`automobileprojektfile`) wählen → Branch `feature/frontend-3d-redesign` (oder `main` nach dem Merge).
3. Render zeigt „cardna-db" + „cardna-api" → **Apply**.
4. Warten, bis der Service **live** ist. Migrationen laufen beim Start automatisch (`prisma migrate deploy`).
5. Deine API-URL erscheint oben, z. B. `https://cardna-api.onrender.com` → teste `…/health` → `{"status":"ok"}`.

**KI-Assistent aktivieren (optional):** im Service unter **Environment** den Key
`ANTHROPIC_API_KEY` setzen (dein Anthropic-Key). Ohne Key läuft alles, nur der Assistent gibt 503.

> Hinweis Free-Tier: Der Service „schläft" nach Inaktivität (erster Aufruf danach dauert ~30 s),
> die kostenlose Postgres läuft 90 Tage. Für Dauerbetrieb später ein bezahlter Plan.

---

## 2. App auf die Cloud-API zeigen

Im Demo-Modus (Standard auf Web) nutzt die App eingebaute Beispieldaten. Für die echte API:

```bash
# Web:
EXPO_PUBLIC_DEMO=0 EXPO_PUBLIC_API_URL=https://cardna-api.onrender.com \
  corepack pnpm@9.6.0 --filter @autolife/mobile run web

# Handy (Expo Go):
EXPO_PUBLIC_DEMO=0 EXPO_PUBLIC_API_URL=https://cardna-api.onrender.com \
  corepack pnpm@9.6.0 --filter @autolife/mobile start
```

Dann registrierst du dich in der App ein echtes Konto, und alle Daten landen in der Cloud-DB.

---

## 3. Optional: Stammdaten seeden

Migrationen erstellen die Tabellen. Die DTC-Fehlercode- und Wissensbasis sind optionale Seeds:

```bash
# In der Render-Shell des Service (Tab "Shell"):
pnpm --filter @autolife/api exec tsx prisma/seed-dtc.ts
pnpm --filter @autolife/api exec tsx prisma/seed-knowledge.ts
```

---

## 4. Andere Plattformen (gleiches Dockerfile)

- **Railway:** New Project ▸ Deploy from Repo → erkennt das `Dockerfile`; separat eine Postgres
  hinzufügen und `DATABASE_URL` + `JWT_SECRET` in die Variablen eintragen.
- **Fly.io:** `fly launch` (nutzt das `Dockerfile`) + `fly postgres create` + `DATABASE_URL`/`JWT_SECRET` als Secrets.

---

## Benötigte Umgebungsvariablen

| Variable | Pflicht | Zweck |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres-Verbindung (von Render automatisch) |
| `JWT_SECRET` | ✅ | Token-Signatur (≥16 Zeichen; Render generiert) |
| `ANTHROPIC_API_KEY` | – | echter KI-Assistent (sonst 503) |
| `ANTHROPIC_MODEL` | – | Standard `claude-opus-4-8` |
| `PORT` / `HOST` | – | von der Plattform gesetzt (Default 3000 / 0.0.0.0) |
