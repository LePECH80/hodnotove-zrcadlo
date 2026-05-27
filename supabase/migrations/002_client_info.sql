-- Přidání jména a emailu klientky do sessions
-- Spusť v Supabase → SQL Editor

alter table sessions
  add column if not exists client_name  text,
  add column if not exists client_email text;
