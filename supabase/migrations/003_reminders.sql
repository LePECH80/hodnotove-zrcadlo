-- Hodnotové zrcadlo — sledování připomínek nedokončeným testerům
-- Spusť tento SQL v Supabase → SQL Editor

-- Kolik připomínek už klientka dostala + kdy naposledy
alter table tokens add column if not exists reminders_sent integer default 0 not null;
alter table tokens add column if not exists last_reminder_at timestamptz;

-- Poznámka k významu sloupce `used`:
-- Od této verze `used = true` znamená "diagnostika dokončena (report vygenerován), přístup ukončen".
-- Token se NESPÁLÍ při prvním otevření — klientka se může vracet, dokud report nevznikne.
