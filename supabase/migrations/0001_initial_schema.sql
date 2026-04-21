-- Taqsimat initial schema. Mirrors architecture doc §3.
-- All monetary columns use numeric(20, 2) to avoid float drift in zakat and
-- inheritance math (CLAUDE.md constraint §5). All user-owned tables enable
-- row-level security (constraint §3) and expose only the owner's rows.

-- Required extensions
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- Shared trigger: keep updated_at current on row modification.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================================
-- §3.1 Profiles
-- =========================================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  preferred_language text default 'uz',
  jurisdiction text default 'UZ',
  madhhab text default 'hanafi',
  hawl_anniversary date,
  is_guest boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- =========================================================================
-- §3.2 Balance sheet — assets and liabilities
-- =========================================================================
create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  category text not null,
  label text,
  amount numeric(20, 2) not null,
  currency text not null default 'UZS',
  metadata jsonb default '{}'::jsonb,
  acquired_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists assets_user_id_idx on assets(user_id);

create trigger assets_set_updated_at
  before update on assets
  for each row execute function set_updated_at();

create table if not exists liabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  category text not null,
  label text,
  amount numeric(20, 2) not null,
  currency text not null default 'UZS',
  counterparty text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists liabilities_user_id_idx on liabilities(user_id);

create trigger liabilities_set_updated_at
  before update on liabilities
  for each row execute function set_updated_at();

-- =========================================================================
-- §3.3 Family graph (for Meras)
-- =========================================================================
create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  relationship text not null,
  gender text,
  is_alive boolean default true,
  count integer default 1,
  name text,
  created_at timestamptz default now()
);

create index if not exists family_members_user_id_idx on family_members(user_id);

-- =========================================================================
-- §3.4 Zakat calculations
-- =========================================================================
create table if not exists zakat_calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  calculated_at timestamptz default now(),
  hawl_start date not null,
  hawl_end date not null,
  nisab_uzs numeric(20, 2) not null,
  nisab_source text,
  total_zakatable numeric(20, 2) not null,
  zakat_owed numeric(20, 2) not null,
  currency text not null default 'UZS',
  breakdown jsonb,
  paid boolean default false,
  paid_at timestamptz,
  paid_method text
);

create index if not exists zakat_calculations_user_id_idx on zakat_calculations(user_id);

-- =========================================================================
-- §3.5 Meras calculations
-- =========================================================================
create table if not exists meras_calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  calculated_at timestamptz default now(),
  total_estate numeric(20, 2) not null,
  burial_costs numeric(20, 2) default 0,
  personal_debts numeric(20, 2) default 0,
  religious_debts numeric(20, 2) default 0,
  wasiyat_amount numeric(20, 2) default 0,
  net_amount numeric(20, 2) not null,
  final_distributable numeric(20, 2) not null,
  family_snapshot jsonb not null,
  distribution jsonb not null,
  corrections_applied text[],
  currency text not null default 'UZS'
);

create index if not exists meras_calculations_user_id_idx on meras_calculations(user_id);

-- =========================================================================
-- §3.6 Investment options (admin-managed)
-- =========================================================================
create table if not exists investment_options (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text not null,
  asset_class text not null,
  description_en text,
  description_uz text,
  min_investment numeric(20, 2),
  min_investment_currency text default 'UZS',
  expected_return_pct numeric(5, 2),
  risk_level text,
  liquidity text,
  fees_description text,
  screening_strict boolean default false,
  screening_screened boolean default false,
  screening_rationale_en text,
  screening_rationale_uz text,
  redirect_url text not null,
  jurisdictions text[] default array['UZ'],
  is_active boolean default true,
  last_reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists investment_options_active_idx on investment_options(is_active);
create index if not exists investment_options_asset_class_idx on investment_options(asset_class);

create trigger investment_options_set_updated_at
  before update on investment_options
  for each row execute function set_updated_at();

-- =========================================================================
-- §3.7 Fin Advisor conversations
-- =========================================================================
create table if not exists advisor_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger advisor_conversations_set_updated_at
  before update on advisor_conversations
  for each row execute function set_updated_at();

create table if not exists advisor_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references advisor_conversations(id) on delete cascade,
  role text not null,
  content text not null,
  sources jsonb,
  flagged_for_scholar boolean default false,
  scholar_response text,
  scholar_responded_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists advisor_messages_conversation_idx on advisor_messages(conversation_id);

-- =========================================================================
-- §3.8 Courses (for Fin Advisor grounding)
-- =========================================================================
create table if not exists courses_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_en text not null,
  title_uz text not null,
  body_en text,
  body_uz text,
  tags text[],
  published boolean default false,
  scholar_reviewed boolean default false,
  scholar_reviewer text,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger courses_articles_set_updated_at
  before update on courses_articles
  for each row execute function set_updated_at();

create table if not exists courses_embeddings (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references courses_articles(id) on delete cascade,
  language text not null,
  chunk_text text not null,
  chunk_order integer not null,
  embedding vector(1536)
);

create index if not exists courses_embeddings_article_idx on courses_embeddings(article_id);

-- =========================================================================
-- §3.9 System tables
-- =========================================================================
create table if not exists prices (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  value numeric(20, 4) not null,
  effective_date date not null,
  source text,
  created_at timestamptz default now(),
  unique(kind, effective_date)
);

create index if not exists prices_kind_date_idx on prices(kind, effective_date desc);

create table if not exists scholar_reviews (
  id uuid primary key default gen_random_uuid(),
  source_module text not null,
  source_id uuid,
  user_id uuid references profiles(id),
  question text not null,
  context jsonb,
  status text default 'pending',
  scholar text,
  response text,
  responded_at timestamptz,
  created_at timestamptz default now()
);

-- =========================================================================
-- §3.10 Row-level security
-- Every user-owned table enables RLS; admin operations use the service role
-- key which bypasses RLS and is only ever used server-side.
-- =========================================================================
alter table profiles enable row level security;
alter table assets enable row level security;
alter table liabilities enable row level security;
alter table family_members enable row level security;
alter table zakat_calculations enable row level security;
alter table meras_calculations enable row level security;
alter table advisor_conversations enable row level security;
alter table advisor_messages enable row level security;
alter table investment_options enable row level security;
alter table courses_articles enable row level security;
alter table prices enable row level security;
alter table scholar_reviews enable row level security;

drop policy if exists "Users view own profile" on profiles;
create policy "Users view own profile"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "Users update own profile" on profiles;
create policy "Users update own profile"
  on profiles for update
  using (auth.uid() = id);

drop policy if exists "Users manage own assets" on assets;
create policy "Users manage own assets"
  on assets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own liabilities" on liabilities;
create policy "Users manage own liabilities"
  on liabilities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own family" on family_members;
create policy "Users manage own family"
  on family_members for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own zakat" on zakat_calculations;
create policy "Users manage own zakat"
  on zakat_calculations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own meras" on meras_calculations;
create policy "Users manage own meras"
  on meras_calculations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own conversations" on advisor_conversations;
create policy "Users manage own conversations"
  on advisor_conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users see own messages" on advisor_messages;
create policy "Users see own messages"
  on advisor_messages for all
  using (
    exists (
      select 1 from advisor_conversations
      where advisor_conversations.id = advisor_messages.conversation_id
        and advisor_conversations.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from advisor_conversations
      where advisor_conversations.id = advisor_messages.conversation_id
        and advisor_conversations.user_id = auth.uid()
    )
  );

drop policy if exists "Public view active investments" on investment_options;
create policy "Public view active investments"
  on investment_options for select
  using (is_active = true);

drop policy if exists "Public view published articles" on courses_articles;
create policy "Public view published articles"
  on courses_articles for select
  using (published = true);

drop policy if exists "Public read prices" on prices;
create policy "Public read prices"
  on prices for select
  using (true);

drop policy if exists "Users see own scholar reviews" on scholar_reviews;
create policy "Users see own scholar reviews"
  on scholar_reviews for select
  using (auth.uid() = user_id);
