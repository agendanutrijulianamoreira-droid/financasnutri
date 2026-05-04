-- ============================================================
-- Migration 001: Initial Schema – Rainha das Finanças
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_crypto";

-- ─── Enums ───────────────────────────────────────────────────
create type person_type      as enum ('PF', 'PJ');
create type transaction_type as enum ('INCOME', 'EXPENSE', 'TRANSFER');
create type account_type     as enum ('CHECKING', 'SAVINGS', 'INVESTMENT', 'CREDIT_CARD', 'CASH');
create type asset_type       as enum ('FIXED_INCOME', 'VARIABLE_INCOME', 'REAL_ESTATE', 'CRYPTO', 'PENSION', 'OTHER');
create type insurance_type   as enum ('LIFE', 'HEALTH', 'AUTO', 'HOME', 'PROFESSIONAL_LIABILITY', 'OTHER');
create type tax_regime_type  as enum ('SIMPLES', 'LUCRO_PRESUMIDO', 'LUCRO_REAL');
create type budget_period    as enum ('MONTHLY', 'YEARLY');
create type goal_status      as enum ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');
create type recurrence_freq  as enum ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

create type transaction_category as enum (
  'SALARY', 'CONSULTING', 'INVESTMENT_RETURN', 'PROFIT_DISTRIBUTION', 'OTHER_INCOME',
  'HOUSING', 'FOOD', 'HEALTH', 'EDUCATION', 'TRANSPORTATION',
  'LEISURE', 'INSURANCE', 'TAXES', 'OPERATIONAL', 'OTHER_EXPENSE'
);

-- ─── Helper: updated_at trigger ──────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Table: user_profiles ─────────────────────────────────────
-- Extends auth.users; one row per authenticated user.
create table public.user_profiles (
  id                          uuid primary key references auth.users(id) on delete cascade,
  email                       text not null,
  full_name                   text not null default '',
  avatar_url                  text,
  profession                  text,
  phone                       text,
  monthly_income_target       numeric(15,2),
  emergency_fund_months       integer not null default 6
                                check (emergency_fund_months between 1 and 36),
  financial_independence_target numeric(15,2),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function set_updated_at();

alter table public.user_profiles enable row level security;

create policy "users: select own"  on public.user_profiles for select  using (auth.uid() = id);
create policy "users: insert own"  on public.user_profiles for insert  with check (auth.uid() = id);
create policy "users: update own"  on public.user_profiles for update  using (auth.uid() = id);
create policy "users: delete own"  on public.user_profiles for delete  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Table: pf_profiles ──────────────────────────────────────
create table public.pf_profiles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.user_profiles(id) on delete cascade,
  cpf         text unique,
  tax_bracket numeric(5,2) check (tax_bracket between 0 and 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_pf_profiles_updated_at
  before update on public.pf_profiles
  for each row execute function set_updated_at();

alter table public.pf_profiles enable row level security;

create policy "pf: select own"  on public.pf_profiles for select  using (auth.uid() = user_id);
create policy "pf: insert own"  on public.pf_profiles for insert  with check (auth.uid() = user_id);
create policy "pf: update own"  on public.pf_profiles for update  using (auth.uid() = user_id);
create policy "pf: delete own"  on public.pf_profiles for delete  using (auth.uid() = user_id);

-- ─── Table: pj_profiles ──────────────────────────────────────
create table public.pj_profiles (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.user_profiles(id) on delete cascade,
  cnpj         text unique not null,
  company_name text not null,
  tax_regime   tax_regime_type not null default 'SIMPLES',
  pro_labore   numeric(15,2),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_pj_profiles_updated_at
  before update on public.pj_profiles
  for each row execute function set_updated_at();

alter table public.pj_profiles enable row level security;

create policy "pj: select own"  on public.pj_profiles for select  using (auth.uid() = user_id);
create policy "pj: insert own"  on public.pj_profiles for insert  with check (auth.uid() = user_id);
create policy "pj: update own"  on public.pj_profiles for update  using (auth.uid() = user_id);
create policy "pj: delete own"  on public.pj_profiles for delete  using (auth.uid() = user_id);

-- ─── Table: accounts ─────────────────────────────────────────
create table public.accounts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.user_profiles(id) on delete cascade,
  name        text not null,
  bank_name   text not null,
  type        account_type not null,
  person_type person_type not null,
  balance     numeric(15,2) not null default 0,
  currency    char(3) not null default 'BRL',
  is_active   boolean not null default true,
  color       text,
  icon        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_accounts_user_id  on public.accounts(user_id);
create index idx_accounts_person_type on public.accounts(user_id, person_type);

create trigger trg_accounts_updated_at
  before update on public.accounts
  for each row execute function set_updated_at();

alter table public.accounts enable row level security;

create policy "accounts: select own"  on public.accounts for select  using (auth.uid() = user_id);
create policy "accounts: insert own"  on public.accounts for insert  with check (auth.uid() = user_id);
create policy "accounts: update own"  on public.accounts for update  using (auth.uid() = user_id);
create policy "accounts: delete own"  on public.accounts for delete  using (auth.uid() = user_id);

-- ─── Table: recurring_transactions ────────────────────────────
create table public.recurring_transactions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.user_profiles(id) on delete cascade,
  account_id   uuid not null references public.accounts(id) on delete cascade,
  person_type  person_type not null,
  type         transaction_type not null,
  category     transaction_category not null,
  amount       numeric(15,2) not null check (amount > 0),
  description  text not null,
  frequency    recurrence_freq not null,
  start_date   date not null,
  end_date     date,
  day_of_month smallint check (day_of_month between 1 and 31),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_recurring_user on public.recurring_transactions(user_id);

create trigger trg_recurring_updated_at
  before update on public.recurring_transactions
  for each row execute function set_updated_at();

alter table public.recurring_transactions enable row level security;

create policy "recurring: select own"  on public.recurring_transactions for select  using (auth.uid() = user_id);
create policy "recurring: insert own"  on public.recurring_transactions for insert  with check (auth.uid() = user_id);
create policy "recurring: update own"  on public.recurring_transactions for update  using (auth.uid() = user_id);
create policy "recurring: delete own"  on public.recurring_transactions for delete  using (auth.uid() = user_id);

-- ─── Table: transactions ─────────────────────────────────────
create table public.transactions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.user_profiles(id) on delete cascade,
  account_id     uuid not null references public.accounts(id) on delete cascade,
  recurrence_id  uuid references public.recurring_transactions(id) on delete set null,
  person_type    person_type not null,
  type           transaction_type not null,
  category       transaction_category not null,
  amount         numeric(15,2) not null check (amount > 0),
  description    text not null,
  date           date not null,
  is_recurring   boolean not null default false,
  tags           text[] not null default '{}',
  notes          text,
  attachments    text[] not null default '{}',
  is_confirmed   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_transactions_user_id   on public.transactions(user_id);
create index idx_transactions_date      on public.transactions(user_id, date desc);
create index idx_transactions_account   on public.transactions(account_id);
create index idx_transactions_person    on public.transactions(user_id, person_type);
create index idx_transactions_category  on public.transactions(user_id, category);

create trigger trg_transactions_updated_at
  before update on public.transactions
  for each row execute function set_updated_at();

alter table public.transactions enable row level security;

create policy "transactions: select own"  on public.transactions for select  using (auth.uid() = user_id);
create policy "transactions: insert own"  on public.transactions for insert  with check (auth.uid() = user_id);
create policy "transactions: update own"  on public.transactions for update  using (auth.uid() = user_id);
create policy "transactions: delete own"  on public.transactions for delete  using (auth.uid() = user_id);

-- Auto-update account balance on transaction insert/update/delete
create or replace function update_account_balance()
returns trigger language plpgsql security definer as $$
declare
  v_delta numeric;
begin
  if tg_op = 'DELETE' then
    v_delta := case when old.type = 'INCOME' then -old.amount else old.amount end;
    update public.accounts set balance = balance + v_delta where id = old.account_id;
    return old;
  end if;

  if tg_op = 'INSERT' then
    v_delta := case when new.type = 'INCOME' then new.amount else -new.amount end;
    update public.accounts set balance = balance + v_delta where id = new.account_id;
    return new;
  end if;

  -- UPDATE: reverse old, apply new
  if tg_op = 'UPDATE' then
    v_delta := case when old.type = 'INCOME' then -old.amount else old.amount end;
    update public.accounts set balance = balance + v_delta where id = old.account_id;
    v_delta := case when new.type = 'INCOME' then new.amount else -new.amount end;
    update public.accounts set balance = balance + v_delta where id = new.account_id;
    return new;
  end if;
end;
$$;

create trigger trg_transaction_balance
  after insert or update or delete on public.transactions
  for each row execute function update_account_balance();

-- ─── Table: budgets ───────────────────────────────────────────
create table public.budgets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.user_profiles(id) on delete cascade,
  person_type person_type not null,
  category    transaction_category not null,
  period      budget_period not null,
  amount      numeric(15,2) not null check (amount > 0),
  month       smallint check (month between 1 and 12),
  year        smallint not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Avoid duplicate budgets for same category/period
  unique (user_id, person_type, category, period, month, year)
);

create index idx_budgets_user on public.budgets(user_id, year, month);

create trigger trg_budgets_updated_at
  before update on public.budgets
  for each row execute function set_updated_at();

alter table public.budgets enable row level security;

create policy "budgets: select own"  on public.budgets for select  using (auth.uid() = user_id);
create policy "budgets: insert own"  on public.budgets for insert  with check (auth.uid() = user_id);
create policy "budgets: update own"  on public.budgets for update  using (auth.uid() = user_id);
create policy "budgets: delete own"  on public.budgets for delete  using (auth.uid() = user_id);

-- ─── Table: financial_goals ───────────────────────────────────
create table public.financial_goals (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid not null references public.user_profiles(id) on delete cascade,
  name                 text not null,
  description          text,
  target_amount        numeric(15,2) not null check (target_amount > 0),
  current_amount       numeric(15,2) not null default 0 check (current_amount >= 0),
  target_date          date not null,
  status               goal_status not null default 'ACTIVE',
  person_type          person_type not null,
  monthly_contribution numeric(15,2) not null default 0,
  color                text,
  icon                 text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index idx_goals_user on public.financial_goals(user_id, status);

create trigger trg_goals_updated_at
  before update on public.financial_goals
  for each row execute function set_updated_at();

alter table public.financial_goals enable row level security;

create policy "goals: select own"  on public.financial_goals for select  using (auth.uid() = user_id);
create policy "goals: insert own"  on public.financial_goals for insert  with check (auth.uid() = user_id);
create policy "goals: update own"  on public.financial_goals for update  using (auth.uid() = user_id);
create policy "goals: delete own"  on public.financial_goals for delete  using (auth.uid() = user_id);

-- ─── Table: assets (Patrimônio) ───────────────────────────────
create table public.assets (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references public.user_profiles(id) on delete cascade,
  name               text not null,
  type               asset_type not null,
  person_type        person_type not null,
  institution        text not null,
  current_value      numeric(15,2) not null check (current_value >= 0),
  purchase_value     numeric(15,2),
  purchase_date      date,
  annual_return_rate numeric(7,4), -- % ao ano
  is_liquid          boolean not null default false,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_assets_user on public.assets(user_id, person_type);

create trigger trg_assets_updated_at
  before update on public.assets
  for each row execute function set_updated_at();

alter table public.assets enable row level security;

create policy "assets: select own"  on public.assets for select  using (auth.uid() = user_id);
create policy "assets: insert own"  on public.assets for insert  with check (auth.uid() = user_id);
create policy "assets: update own"  on public.assets for update  using (auth.uid() = user_id);
create policy "assets: delete own"  on public.assets for delete  using (auth.uid() = user_id);

-- ─── Table: asset_history ─────────────────────────────────────
create table public.asset_history (
  id          uuid primary key default uuid_generate_v4(),
  asset_id    uuid not null references public.assets(id) on delete cascade,
  user_id     uuid not null references public.user_profiles(id) on delete cascade,
  value       numeric(15,2) not null,
  recorded_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_asset_history on public.asset_history(asset_id, recorded_at desc);

alter table public.asset_history enable row level security;

create policy "asset_history: select own"  on public.asset_history for select  using (auth.uid() = user_id);
create policy "asset_history: insert own"  on public.asset_history for insert  with check (auth.uid() = user_id);
create policy "asset_history: update own"  on public.asset_history for update  using (auth.uid() = user_id);
create policy "asset_history: delete own"  on public.asset_history for delete  using (auth.uid() = user_id);

-- ─── Table: insurances ────────────────────────────────────────
create table public.insurances (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.user_profiles(id) on delete cascade,
  name            text not null,
  type            insurance_type not null,
  insurer         text not null,
  policy_number   text,
  monthly_premium numeric(15,2) not null check (monthly_premium >= 0),
  coverage_amount numeric(15,2) not null check (coverage_amount >= 0),
  start_date      date not null,
  end_date        date,
  is_active       boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_insurances_user on public.insurances(user_id, is_active);

create trigger trg_insurances_updated_at
  before update on public.insurances
  for each row execute function set_updated_at();

alter table public.insurances enable row level security;

create policy "insurance: select own"  on public.insurances for select  using (auth.uid() = user_id);
create policy "insurance: insert own"  on public.insurances for insert  with check (auth.uid() = user_id);
create policy "insurance: update own"  on public.insurances for update  using (auth.uid() = user_id);
create policy "insurance: delete own"  on public.insurances for delete  using (auth.uid() = user_id);

-- ─── Table: monthly_reports ───────────────────────────────────
create table public.monthly_reports (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references public.user_profiles(id) on delete cascade,
  month                    smallint not null check (month between 1 and 12),
  year                     smallint not null,
  pf_total_income          numeric(15,2) not null default 0,
  pf_total_expenses        numeric(15,2) not null default 0,
  pf_net_result            numeric(15,2) not null default 0,
  pj_gross_revenue         numeric(15,2) not null default 0,
  pj_total_expenses        numeric(15,2) not null default 0,
  pj_taxes_paid            numeric(15,2) not null default 0,
  pj_net_profit            numeric(15,2) not null default 0,
  pj_pro_labore            numeric(15,2) not null default 0,
  pj_profit_distribution   numeric(15,2) not null default 0,
  total_savings            numeric(15,2) not null default 0,
  total_investments_added  numeric(15,2) not null default 0,
  net_worth_snapshot       numeric(15,2) not null default 0,
  report_data              jsonb not null default '{}',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id, month, year)
);

create index idx_monthly_reports_user on public.monthly_reports(user_id, year desc, month desc);

create trigger trg_monthly_reports_updated_at
  before update on public.monthly_reports
  for each row execute function set_updated_at();

alter table public.monthly_reports enable row level security;

create policy "reports: select own"  on public.monthly_reports for select  using (auth.uid() = user_id);
create policy "reports: insert own"  on public.monthly_reports for insert  with check (auth.uid() = user_id);
create policy "reports: update own"  on public.monthly_reports for update  using (auth.uid() = user_id);
create policy "reports: delete own"  on public.monthly_reports for delete  using (auth.uid() = user_id);
