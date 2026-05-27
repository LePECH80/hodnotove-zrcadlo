# Hodnotové zrcadlo — inspiraise

AI koučovací aplikace pro hodnotovou diagnostiku klientek.

---

## 🚀 Spuštění lokálně

### 1. Závislosti

```bash
cd hodnotove-zrcadlo
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Otevři `.env.local` a vyplň:

| Proměnná | Kde ji najdeš |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `NEXT_PUBLIC_CALENDLY_URL` | Tvůj Calendly odkaz |

### 3. Databáze

V Supabase → SQL Editor spusť celý soubor:
```
supabase/migrations/001_init.sql
```

### 4. Metodika (AI systémový prompt)

Otevři `src/lib/systemPrompt.ts` a nahraď placeholder texty svoji metodikou.
Zachovej instrukce o markerech `##FÁZE:X##` a `##HOTOVO##` — ty řídí progress bar a report.

### 5. Spuštění

```bash
npm run dev
```

Aplikace běží na http://localhost:3000

---

## 🔑 Vytváření tokenů pro klientky

Po platbě přes FAPI potřebuješ vygenerovat unikátní token a poslat klientce odkaz.

**Varianta A — Ručně v Supabase SQL Editoru:**
```sql
select generate_client_token('klientka@email.cz');
```
Výsledkem je token (hex string). Odkaz je: `https://tvoje-domena.cz/start?token=VÝSLEDEK`

**Varianta B — FAPI Webhook:**
Nastav v FAPI webhook na endpoint `POST /api/verify-token` nebo si vytvoř
endpoint `POST /api/create-token` (viz kód níže) a FAPI mu pošle email.

Příklad endpointu pro FAPI (přidej jako `src/app/api/create-token/route.ts`):
```typescript
// Zabezpeč tento endpoint secret tokenem v hlavičce!
// FAPI → Integrace → Webhook → URL: https://tvoja-domena.cz/api/create-token
// Header: x-webhook-secret: [tvůj tajný klíč]
```

---

## 🌐 Nasazení na Vercel

1. Nahraj projekt na GitHub
2. Vercel → Add New Project → importuj repozitář
3. V Vercel → Settings → Environment Variables přidej všechny proměnné z `.env.local`
4. Deploy

### Doména (Wedos)

V Wedos DNS nastavení přidej:
- `CNAME diagnostika → cname.vercel-dns.com`

V Vercel → Project → Settings → Domains přidej: `diagnostika.tvojedomena.cz`

---

## 📁 Struktura projektu

```
src/
├── app/
│   ├── start/page.tsx       — Ověření tokenu + uvítání
│   ├── chat/page.tsx        — Hlavní chat rozhraní
│   ├── report/page.tsx      — Report + upsell sekce
│   └── api/
│       ├── verify-token/    — POST: ověří token, vytvoří session
│       ├── chat/            — POST: Anthropic AI chat
│       ├── load-session/    — GET: načte session z Supabase
│       ├── generate-report/ — POST: vygeneruje report
│       └── waitlist/        — POST: uloží email na čekací listinu
└── lib/
    ├── supabase.ts          — Supabase klient
    └── systemPrompt.ts      — ← SEM VLOŽt svoji metodiku
```
