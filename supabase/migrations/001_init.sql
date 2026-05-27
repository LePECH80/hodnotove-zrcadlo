-- Hodnotové zrcadlo — databázové schéma
-- Spusť tento SQL v Supabase → SQL Editor

-- Tabulka tokenů (jeden token = jeden přístup klientky)
create table if not exists tokens (
  id           uuid default gen_random_uuid() primary key,
  token        text unique not null,
  email        text not null,
  used         boolean default false not null,
  created_at   timestamptz default now() not null
);

-- Tabulka sezení (konverzace + aktuální fáze)
create table if not exists sessions (
  id             uuid default gen_random_uuid() primary key,
  token_id       uuid references tokens(id) not null,
  messages       jsonb default '[]'::jsonb not null,
  current_phase  integer default 1 not null,
  report         text,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

-- Čekací listina pro Business Atelier
create table if not exists waitlist (
  id          uuid default gen_random_uuid() primary key,
  email       text not null,
  created_at  timestamptz default now() not null
);

-- Automatický updated_at trigger pro sessions
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger sessions_updated_at
  before update on sessions
  for each row execute function update_updated_at();

-- Row Level Security — API routes používají service role key, takže mají přístup vždy.
-- Anon klíč z frontendu nemá přímý přístup (vše jde přes naše API routes).
alter table tokens enable row level security;
alter table sessions enable row level security;
alter table waitlist enable row level security;

-- Pomocná funkce: vygeneruj token pro FAPI webhook
-- Použití: select generate_client_token('klientka@email.cz');
create or replace function generate_client_token(client_email text)
returns text as $$
declare
  new_token text;
begin
  new_token := encode(gen_random_bytes(32), 'hex');
  insert into tokens (token, email) values (new_token, client_email);
  return new_token;
end;
$$ language plpgsql security definer;
