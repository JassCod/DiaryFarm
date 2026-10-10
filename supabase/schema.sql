-- DairyFarm schema (applied to the Supabase project as migration "dairy_schema")
create table public.animals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tag_no text not null,
  name text,
  species text not null check (species in ('cow','buffalo')),
  breed text,
  sex text not null default 'female' check (sex in ('female','male')),
  dob date,
  color text,
  mother_id uuid references public.animals(id) on delete set null,
  sire text,
  source text not null default 'born' check (source in ('born','purchased')),
  purchase_date date,
  purchase_price numeric(12,2),
  status text not null default 'heifer' check (status in ('lactating','dry','heifer','calf','bull','sold','dead')),
  lactation_no int not null default 0,
  weight_kg numeric(8,2),
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, tag_no)
);
create index on public.animals(user_id);
create index on public.animals(mother_id);

create table public.milk_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  record_date date not null default current_date,
  morning_l numeric(6,2) not null default 0 check (morning_l >= 0),
  evening_l numeric(6,2) not null default 0 check (evening_l >= 0),
  fat_pct numeric(4,2),
  snf_pct numeric(4,2),
  notes text,
  created_at timestamptz not null default now(),
  unique (animal_id, record_date)
);
create index on public.milk_records(user_id, record_date);

create table public.health_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  record_date date not null default current_date,
  record_type text not null default 'treatment' check (record_type in ('treatment','vaccination','deworming','checkup','surgery')),
  disease text,
  symptoms text,
  medicine text,
  dosage text,
  reason text,
  vet_name text,
  cost numeric(10,2),
  withdrawal_until date,
  next_due date,
  outcome text,
  notes text,
  created_at timestamptz not null default now()
);
create index on public.health_records(user_id, record_date);
create index on public.health_records(animal_id);

create table public.breeding_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  heat_date date,
  insemination_date date not null,
  method text not null default 'AI' check (method in ('AI','natural')),
  bull_semen text,
  technician text,
  attempt_no int not null default 1,
  pd_date date,
  pd_result text not null default 'pending' check (pd_result in ('pending','pregnant','not_pregnant','aborted')),
  expected_calving date,
  dry_off_date date,
  actual_calving date,
  calving_outcome text,
  calf_id uuid references public.animals(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
create index on public.breeding_records(user_id);
create index on public.breeding_records(animal_id);
create index on public.breeding_records(calf_id);

alter table public.animals enable row level security;
alter table public.milk_records enable row level security;
alter table public.health_records enable row level security;
alter table public.breeding_records enable row level security;

do $$
declare t text;
begin
  foreach t in array array['animals','milk_records','health_records','breeding_records'] loop
    execute format('create policy "own_select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "own_insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "own_update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "own_delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;
