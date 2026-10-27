-- =========================================================
-- RESET E CREAZIONE DATABASE ACR / EDUCATORI
-- =========================================================

-- 1. PULIZIA EVENTUALI TABELLE ESISTENTI
drop table if exists tematiche cascade;
drop table if exists presenze_ragazzi cascade;
drop table if exists presenze_educatori cascade;
drop table if exists firme cascade;
drop table if exists ragazzi cascade;
drop table if exists classe_educatori cascade;
drop table if exists classi cascade;
drop table if exists educatori cascade;
drop table if exists catechisti cascade;
drop table if exists classe_catechisti cascade;
drop table if exists presenze_bambini cascade;
drop table if exists presenza_messa cascade;
drop table if exists bambini cascade;

-- Estensione per UUID
create extension if not exists "pgcrypto";

-- 2. CREAZIONE STRUTTURA TABELLE

-- Educatori
create table educatori (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  password text not null,
  moderatore boolean not null default false,
  created_at timestamptz not null default now()
);

-- Classi / Gruppi
create table classi (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ordine int, -- posizione nell'elenco (1 = prima); le classi senza ordine vanno in fondo
  created_at timestamptz not null default now(),
  unique (nome)
);

-- Associazione Educatore <-> Classe
create table classe_educatori (
  classe_id uuid references classi(id) on delete cascade,
  educatore_id uuid references educatori(id) on delete cascade,
  ruolo text,
  primary key (classe_id, educatore_id)
);

-- Ragazzi / Bambini
create table ragazzi (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid references classi(id) on delete cascade,
  nome text not null,
  cognome text not null,
  eta int,
  intolleranze text,
  created_at timestamptz not null default now()
);

-- Firme Educatori
create table firme (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid references classi(id) on delete cascade,
  educatore_id uuid references educatori(id) on delete cascade,
  data date not null,
  created_at timestamptz not null default now(),
  unique (classe_id, educatore_id, data)
);

-- Presenze Educatori
create table presenze_educatori (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid references classi(id) on delete cascade,
  educatore_id uuid references educatori(id) on delete cascade,
  data date not null,
  presente boolean not null default true,
  unique (classe_id, educatore_id, data)
);

-- Presenze Ragazzi
create table presenze_ragazzi (
  id uuid primary key default gen_random_uuid(),
  ragazzo_id uuid references ragazzi(id) on delete cascade,
  classe_id uuid references classi(id) on delete cascade,
  data date not null,
  presente boolean not null default true,
  segnata_da uuid references educatori(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (ragazzo_id, data)
);

-- Tematiche / Attività
create table tematiche (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid references classi(id) on delete cascade,
  data date not null,
  titolo text not null,
  descrizione text,
  creata_da uuid references educatori(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (classe_id, data)
);

-- Finestra di firma (Sabato e Domenica)
create or replace function is_finestra_firma()
returns boolean
language sql
stable
as $$
  select extract(dow from now()) in (0, 6);
$$;

-- La firma è consentita esclusivamente per date di sabato o domenica.
create or replace function verifica_giorno_firma()
returns trigger
language plpgsql
as $$
begin
  if extract(dow from new.data) not in (0, 6) then
    raise exception 'La firma è consentita solo il sabato e la domenica.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_verifica_giorno_firma on firme;
create trigger trg_verifica_giorno_firma
before insert or update of data on firme
for each row execute function verifica_giorno_firma();

-- 3. INSERIMENTO DATI INIZIALI

-- Inserimento Educatori
insert into educatori (nome, password) values
  ('Rosanna Pica', 'rosa123'),
  ('Rosaria Califano', 'roxy456'),
  ('Adelaide Galano', 'ade789'),
  ('Antonia Sica', 'anto321'),
  ('Luigi Iannotti', 'luigi654'),
  ('Grazia Pia Petrosino', 'grazia987'),
  ('Denise Sirica', 'denny147'),
  ('Daniele Meo', 'dani258'),
  ('Francesco Pio Petrosino', 'fra369'),
  ('Francesca Pia Mellone', 'frenky741'),
  ('Davide Leonetti', 'dado852'),
  ('Annamaria Santonicola', 'anna963');

-- Inserimento Classi
insert into classi (nome, ordine) values
  ('Ultimo anno Infanzia', 1),
  ('1ª Elementare', 2),
  ('2ª Elementare', 3),
  ('3ª Elementare', 4),
  ('4ª Elementare', 5),
  ('5ª Elementare', 6),
  ('1ª Media', 7),
  ('2ª e 3ª Media', 8),
  ('1º e 2º Superiore', 9)
on conflict (nome) do nothing;

-- Inserimento Associazione Educatori <-> Classi
insert into classe_educatori (classe_id, educatore_id)
select c.id, e.id
from (values
  ('Ultimo anno Infanzia', 'Rosanna Pica', 'rosa123'),
  ('Ultimo anno Infanzia', 'Rosaria Califano', 'roxy456'),
  ('Ultimo anno Infanzia', 'Adelaide Galano', 'ade789'),

  ('1ª Elementare',        'Rosanna Pica', 'rosa123'),
  ('1ª Elementare',        'Rosaria Califano', 'roxy456'),
  ('1ª Elementare',        'Adelaide Galano', 'ade789'),

  ('2ª Elementare',        'Antonia Sica', 'anto321'),
  ('2ª Elementare',        'Luigi Iannotti', 'luigi654'),

  ('3ª Elementare',        'Grazia Pia Petrosino', 'grazia987'),
  ('3ª Elementare',        'Denise Sirica', 'denny147'),
  ('3ª Elementare',        'Daniele Meo', 'dani258'),

  ('4ª Elementare',        'Francesco Pio Petrosino', 'fra369'),
  ('4ª Elementare',        'Francesca Pia Mellone', 'frenky741'),
  ('4ª Elementare',        'Davide Leonetti', 'dado852'),

  ('5ª Elementare',        'Adelaide Galano', 'ade789'),
  ('5ª Elementare',        'Grazia Pia Petrosino', 'grazia987'),
  ('5ª Elementare',        'Denise Sirica', 'denny147'),

  ('1ª Media',             'Francesca Pia Mellone', 'frenky741'),
  ('1ª Media',             'Antonia Sica', 'anto321'),

  ('2ª e 3ª Media',        'Luigi Iannotti', 'luigi654'),

  ('1º e 2º Superiore',    'Annamaria Santonicola', 'anna963'),
  ('1º e 2º Superiore',    'Francesco Pio Petrosino', 'fra369')
) as x(classe_nome, ed_nome, ed_pass)
join classi c on c.nome = x.classe_nome
join educatori e on e.nome = x.ed_nome and e.password = x.ed_pass
on conflict (classe_id, educatore_id) do nothing;

-- 4. RLS DISATTIVATA (Supabase a volte la attiva in automatico sulle nuove tabelle
--    e, senza policy, le query restituiscono zero righe)
alter table educatori          disable row level security;
alter table classi             disable row level security;
alter table classe_educatori   disable row level security;
alter table ragazzi            disable row level security;
alter table firme              disable row level security;
alter table presenze_educatori disable row level security;
alter table presenze_ragazzi   disable row level security;
alter table tematiche          disable row level security;
