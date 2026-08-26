# Hodnotové zrcadlo — shrnutí konverzace (handoff do nového vlákna)

> Pro pokračování v novém chatu: napiš „pokračujeme na Hodnotovém zrcadle, koukni do paměti".
> Živý stav je i v paměti (`hodnotove_zrcadlo_stav.md`). Tenhle soubor = přehled, co jsme v téhle konverzaci řešili.

## Co je appka
AI diagnostika hodnoty. Next.js 15 v podsložce `hodnotove-zrcadlo/` (repo „claude carousely"). Doména **mapa.inspiraise.com** (Vercel). Landing = `landing/index.html` (vkládá se do WordPressu na inspiraise.com/hodnotove-zrcadlo). Kód přes GitHub Desktop → Vercel auto-deploy. Model: claude-sonnet-4-6.

## Klíčová fakta / ID
- Kontaktní e-mail: **lenka.pechrova@inspiraise.com** (lenka@lenkapechrova.cz NEEXISTUJE)
- IG: @lenka_pechrova_inspiraise
- FAPI produkt HZ kód **653924** (1900 Kč) · konzultace 653939
- Koupě HZ: `form.fapi.cz/?id=9baba79b-c665-404a-8c55-45f6aa79656f`
- Koupě konzultace: `form.fapi.cz/?id=00965c12-7f50-494b-ba9a-6b812d69313a` (v reportu QR + odkaz)
- FAPI webhook → `/api/fapi-webhook` (událost Zaplacení faktury); posílá jen invoice ID, my stáhneme detail přes FAPI API (Basic auth: username lenka.pechrova@inspiraise.com + FAPI_API_KEY)
- Vercel = **Hobby** (limit funkce 60 s) — kritické pro délku reportu
- ⚠️ Lokální `.env.local` RESEND klíč je OMEZENÝ (error 1010) — maily jdou jen z produkce. Offline generování reportu funguje, ale mail se pak posílá ručně (odkaz).

## Co jsme v téhle konverzaci udělali
1. **Přístup platí, dokud není report** — token se nespálí při otevření (spálí až po vygenerování reportu). Resume přes localStorage + token. Připomínkový cron (den 1/3/7, max 3×). Opraveno matoucí slovo „jednorázový" v mailech i landingu.
2. **Obnovení stránky / usnutí** — přechod ze sessionStorage na **localStorage** + auto-obnova přes token (přežije zavření prohlížeče). Univerzální jistota = odkaz z mailu.
3. **Report ve 2. osobě, bez pomlček** — pravidla v promptu + server-side strip (— → čárka).
4. **Avatar v chatu = Lenčina fotka** (`public/lenka.png`, zmenšeno na 160px/35KB). Pryč „A"/„IR".
5. **Nativní diktování** (Web Speech API, cs-CZ) — tlačítko 🎙 v chatu, živý přepis, nežere kredity.
6. **QR kód + kontakt v PDF reportu** (PDF blok předělán na tmavý text na světlém, ať se vytiskne).
7. **Prompt caching** (chat + report) — úspora ~70 % kreditů (systémový prompt se cachuje).
8. **Zeštíhlení reportu (hlavní)** — schéma z ~15 na 10 sekcí, vyhozeno opakování (valueZone/patterns/biggestValueZones/positioning/tensions/keepDelegate/shortMirror; nextSteps+experiments→firstSteps; offerDirections→directions; strengthVsRisk bez peakValue). max_tokens 4000. Ověřeno: reálný report ~3200 tokenů, kompletní.
9. **CTA na konzultaci** — mezikrok (hodnota konzultace) + navázání na směry z reportu; úvod a karta se už neopakují.
10. **Oprava kontaktního mailu** na lenka.pechrova@inspiraise.com (6 souborů + .env.local).
11. Ručně vygenerované reporty (mimo Vercel) pro **Báru Hejtmánkovou** a **Lucii Rolovou** (padaly kvůli timeoutu/tokenům) — uloženo, odkaz poslán ručně.

## ⚠️ Zbývá udělat (akce pro Lenku)
- **Pushnout** poslední změny (zeštíhlený report + oprava mailu): `generate-report/route.ts`, `report/page.tsx`, `chat/page.tsx`, `start/page.tsx`, `thank-you/page.tsx`, `fapi-webhook/route.ts`, `send-reminders/route.ts`, `.env.local`.
- **Na Vercelu** změnit env `NEXT_PUBLIC_CONTACT_EMAIL` → `lenka.pechrova@inspiraise.com`.

## TODO na příště (odložené)
- **Petřina koučovací zpětná vazba k ROZHOVORU** (od koučky Petry Löfflerové, důležité): kouč moc vkládá vhledy do úst místo aby je dostal z klienta; potvrzovací smyčka — chybí test protipříkladem („kdy ti to nevyšlo?"); u „zasloužím si to" zůstat dýl a jít do konkrétna (ne jen reframe); přemíra validace tlačí do souhlasu; hlídat klesající energii a zkrácené odpovědi ke konci; lidem říct ať si udělají klid a nespěchají.
- Znovu ověřit, že Fáze 5 netlačí na sílu do byznysu/monetizace (má být adaptivní).
- Náklady na kredity dál sledovat (caching nasazen; kratší report taky pomůže).

## Kde jsou podklady
- `landing/index.html` — landing
- `podklady/` — messaging kit, náhledy reportu (report-novy-nahled.html), Petřin rozhovor, tento soubor
- `public/lenka.png` — avatar; QR je inline v `report/page.tsx`
