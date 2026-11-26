-- CarmelAlerta · esquema para Supabase
-- Ejecuta este fichero entero en el SQL Editor de tu proyecto.
-- Después, para hacerte moderador:
--   update public.profiles set is_moderator = true where username = 'TU_USUARIO';

-- ───────── Perfiles ─────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 20),
  points int not null default 0 check (points >= 0),
  lifetime_points int not null default 0 check (lifetime_points >= 0),
  is_moderator boolean not null default false,
  strikes int not null default 0,
  suspended_until timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), 'vei' || substr(new.id::text, 1, 6)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_moderator() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_moderator from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_suspended() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select suspended_until > now() from public.profiles where id = auth.uid()), false)
$$;

-- ───────── Incidencias ─────────
create type incident_status as enum ('pending', 'verified', 'communicated', 'in_progress', 'solved', 'rejected');

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('mobiliari','voreres','neteja','enllumenat','barreres','transit','obres','verd')),
  description text not null default '' check (char_length(description) <= 250),
  address text not null default '',
  lat double precision not null check (lat between 41.40 and 41.44),
  lng double precision not null check (lng between 2.13 and 2.18),
  photo_url text,
  status incident_status not null default 'pending',
  supports int not null default 0,
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index incidents_status_idx on public.incidents (status, created_at desc);

create table public.votes (
  incident_id uuid not null references public.incidents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (incident_id, user_id)
);

-- ───────── Comercios y premios ─────────
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  shop text not null,
  title text not null,
  cost int not null check (cost > 0),
  category text not null default 'Alimentació',
  address text not null default '',
  open_until text,
  active boolean not null default true
);

create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_id uuid not null references public.rewards(id),
  code text not null,
  cost int not null,
  created_at timestamptz not null default now()
);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- ───────── RLS ─────────
alter table public.profiles    enable row level security;
alter table public.incidents   enable row level security;
alter table public.votes       enable row level security;
alter table public.rewards     enable row level security;
alter table public.redemptions enable row level security;
alter table public.notices     enable row level security;

-- Nadie modifica perfiles (puntos, rol...) directamente: solo las funciones de abajo.
create policy "profiles readable" on public.profiles for select using (true);

create policy "incidents readable" on public.incidents for select using (
  status in ('verified', 'communicated', 'in_progress', 'solved')
  or author_id = auth.uid()
  or public.is_moderator()
);
create policy "incidents insert own pending" on public.incidents for insert to authenticated
  with check (author_id = auth.uid() and status = 'pending' and supports = 0 and not public.is_suspended());

create policy "votes own" on public.votes for select using (user_id = auth.uid());
create policy "rewards readable" on public.rewards for select using (true);
create policy "redemptions own" on public.redemptions for select using (user_id = auth.uid());
create policy "notices readable" on public.notices for select using (true);
create policy "notices moderators insert" on public.notices for insert to authenticated with check (public.is_moderator());

-- ───────── Funciones (la lógica de puntos vive en el servidor) ─────────
create or replace function public.support_incident(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v public.incidents; n int;
begin
  if auth.uid() is null then raise exception 'Cal iniciar sessió'; end if;
  select * into v from public.incidents where id = p_id;
  if not found then raise exception 'Incidència no trobada'; end if;
  if v.author_id = auth.uid() then raise exception 'No pots donar suport a la teva pròpia incidència'; end if;
  if v.status not in ('verified', 'communicated', 'in_progress') then
    raise exception 'Aquesta incidència ja no admet suport';
  end if;
  insert into public.votes (incident_id, user_id) values (p_id, auth.uid()) on conflict do nothing;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'Ja has donat suport a aquesta incidència'; end if;
  update public.incidents set supports = supports + 1 where id = p_id;
  update public.profiles set points = points + 5, lifetime_points = lifetime_points + 5 where id = auth.uid();
end $$;

create or replace function public.moderate_incident(
  p_id uuid, p_action text, p_status incident_status default null, p_reason text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v public.incidents;
begin
  if not public.is_moderator() then raise exception 'Només moderadors'; end if;
  select * into v from public.incidents where id = p_id for update;
  if not found then raise exception 'Incidència no trobada'; end if;

  if p_action = 'set_status' then
    if v.status in ('pending', 'rejected') or p_status is null or p_status in ('pending', 'rejected') then
      raise exception 'Estat no vàlid';
    end if;
    update public.incidents set status = p_status, updated_at = now() where id = p_id;

  elsif p_action in ('verify', 'reject', 'reject_fake') then
    if v.status <> 'pending' then raise exception 'Aquesta incidència ja no està pendent'; end if;
    if p_action = 'verify' then
      update public.incidents set status = 'verified', updated_at = now() where id = p_id;
      update public.profiles set points = points + 50, lifetime_points = lifetime_points + 50 where id = v.author_id;
    else
      update public.incidents set status = 'rejected', reject_reason = nullif(trim(p_reason), ''), updated_at = now() where id = p_id;
      if p_action = 'reject_fake' then
        update public.profiles
          set points = greatest(points - 100, 0), lifetime_points = greatest(lifetime_points - 100, 0), strikes = strikes + 1
          where id = v.author_id;
        update public.profiles
          set suspended_until = now() + interval '30 days', strikes = 0
          where id = v.author_id and strikes >= 3;
      end if;
    end if;
  else
    raise exception 'Acció desconeguda';
  end if;
end $$;

create or replace function public.redeem_reward(p_id uuid) returns json
language plpgsql security definer set search_path = public as $$
declare r public.rewards; pts int; red public.redemptions; c text;
begin
  select * into r from public.rewards where id = p_id and active;
  if not found then raise exception 'Premi no disponible'; end if;
  select points into pts from public.profiles where id = auth.uid() for update;
  if pts is null then raise exception 'Cal iniciar sessió'; end if;
  if pts < r.cost then raise exception 'No tens prou punts'; end if;
  update public.profiles set points = points - r.cost where id = auth.uid();
  c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  insert into public.redemptions (user_id, reward_id, code, cost) values (auth.uid(), p_id, c, r.cost) returning * into red;
  return json_build_object('id', red.id, 'reward_id', r.id, 'shop', r.shop, 'title', r.title,
                           'cost', red.cost, 'code', red.code, 'created_at', red.created_at);
end $$;

-- ───────── Fotos ─────────
insert into storage.buckets (id, name, public) values ('incident-photos', 'incident-photos', true)
on conflict (id) do nothing;

create policy "photos upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'incident-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos public read" on storage.objects for select
  using (bucket_id = 'incident-photos');

-- ───────── Premios de ejemplo (sustitúyelos por comercios reales) ─────────
insert into public.rewards (shop, title, cost, category, address, open_until) values
  ('Fruiteria del Barri', '10% de descompte en fruita i verdura', 100, 'Alimentació', 'Zona Mercat', '20:00'),
  ('Fleca El Forn de la Rambla', 'Cafè amb llet i pasta artesana', 80, 'Alimentació', 'Rambla del Carmel', '19:30'),
  ('Papereria La Plana', 'Val de 5 € en material escolar', 150, 'Llibreria i papereria', 'Plaça del Carmel', '20:30'),
  ('Farmàcia Ponent', 'Kit de primers auxilis', 120, 'Salut', 'Zona Pastrana', null);
