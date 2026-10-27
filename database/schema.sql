-- =====================================================================
-- База данных: веб-приложение для облачной эмуляции ретро-игр (NES)
-- СУБД: PostgreSQL (Supabase). Запускать целиком в SQL Editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Справочник консолей
-- ---------------------------------------------------------------------
create table public.consoles (
  id             smallint generated always as identity primary key,
  name           text not null unique,        -- название консоли
  file_extension text not null,               -- расширение файлов игр
  emulator_core  text not null                -- ядро эмулятора для этой консоли
);

insert into public.consoles (name, file_extension, emulator_core)
values ('NES', '.nes', 'nes');

-- ---------------------------------------------------------------------
-- 2. Профили пользователей
--    (логин и пароль хранит встроенная таблица auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null unique check (char_length(trim(username)) > 0),
  created_at timestamptz not null default now()
);

-- Профиль создаётся автоматически при регистрации
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3. Игры (личная библиотека)
-- ---------------------------------------------------------------------
create table public.games (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  console_id  smallint not null references public.consoles(id),
  title       text not null,                  -- название игры в библиотеке
  file_name   text not null,                  -- исходное имя загруженного файла
  file_path   text not null unique,           -- путь к файлу в хранилище games
  file_size   integer not null check (file_size > 0),  -- размер, байт
  uploaded_at timestamptz not null default now()
);

create index games_user_id_idx on public.games(user_id);

-- ---------------------------------------------------------------------
-- 4. Сохранённые состояния игр (одно сохранение на игру)
-- ---------------------------------------------------------------------
create table public.save_states (
  id        uuid primary key default gen_random_uuid(),
  game_id   uuid not null unique references public.games(id) on delete cascade,
  file_path text not null unique,             -- путь к файлу в хранилище states
  file_size integer not null check (file_size > 0),
  saved_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. Раскладка управления
-- ---------------------------------------------------------------------
create table public.control_layouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  console_id   smallint not null references public.consoles(id),
  button       text not null
               check (button in ('UP','DOWN','LEFT','RIGHT','A','B','START','SELECT')),
  input_device text not null default 'keyboard'
               check (input_device in ('keyboard','gamepad')),
  input_code   text not null,                 -- код клавиши или кнопки геймпада
  unique (user_id, console_id, button, input_device)
);

-- =====================================================================
-- Защита данных: каждый пользователь видит только свои записи
-- =====================================================================
alter table public.consoles        enable row level security;
alter table public.profiles        enable row level security;
alter table public.games           enable row level security;
alter table public.save_states     enable row level security;
alter table public.control_layouts enable row level security;

create policy "consoles_read" on public.consoles
  for select to authenticated using (true);

create policy "profiles_own" on public.profiles
  for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "games_own" on public.games
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "save_states_own" on public.save_states
  for all to authenticated
  using (exists (select 1 from public.games g
                 where g.id = save_states.game_id and g.user_id = auth.uid()))
  with check (exists (select 1 from public.games g
                      where g.id = save_states.game_id and g.user_id = auth.uid()));

create policy "control_layouts_own" on public.control_layouts
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =====================================================================
-- Файловое хранилище: games (файлы игр) и states (сохранения)
-- Лимит размера файла: 5 МБ. Путь файла: <id пользователя>/<имя файла>
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('games',  'games',  false, 5242880),
       ('states', 'states', false, 5242880)
on conflict (id) do nothing;

create policy "games_files_own" on storage.objects
  for all to authenticated
  using (bucket_id = 'games' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'games' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "states_files_own" on storage.objects
  for all to authenticated
  using (bucket_id = 'states' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'states' and (storage.foldername(name))[1] = auth.uid()::text);
