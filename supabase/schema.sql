-- Схема Supabase для «Нет энергетикам».
-- Выполнить в SQL Editor проекта Supabase.
--
-- Модель доступа: без логина, один логический пользователь (колонка user_id).
-- RLS включён, политики разрешают доступ роли anon. Приложение приватное
-- (ссылка не публикуется), поэтому это приемлемый компромисс. Если нужна
-- строгая защита — добавить Supabase Auth и привязать политики к auth.uid().

-- Профили (вход по коду). Данные пользователя лежат под секретным user_id,
-- который выводится из кода (deriveDid), и нигде не хранится в открытом виде.
-- В profiles хранится только salt + verifier для проверки кода на клиенте.
create table if not exists profiles (
  id         text primary key,
  name       text not null,
  salt       text not null,
  verifier   text not null,
  created_at timestamptz not null default now()
);

create table if not exists entries (
  user_id    text not null default 'default',
  date       text not null,                 -- 'YYYY-MM-DD'
  status     text not null check (status in ('clean', 'drank')),
  note       text,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create table if not exists achievements (
  user_id     text not null default 'default',
  id          text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists messages (
  user_id    text not null default 'default',
  id         text primary key,
  role       text not null,
  content    text not null,
  created_at timestamptz not null default now()
);

create table if not exists meta (
  user_id text not null default 'default',
  key     text not null,
  value   jsonb,
  primary key (user_id, key)
);

-- ── RLS ───────────────────────────────────────────────────────────────────
alter table profiles     enable row level security;
alter table entries      enable row level security;
alter table achievements enable row level security;
alter table messages     enable row level security;
alter table meta         enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profiles', 'entries', 'achievements', 'messages', 'meta'] loop
    execute format('drop policy if exists anon_all on %I;', t);
    execute format(
      'create policy anon_all on %I for all to anon using (true) with check (true);', t
    );
  end loop;
end $$;
