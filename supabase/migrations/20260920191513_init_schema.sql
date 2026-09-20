-- Casa dos Balancim: schema inicial
-- products, ml_credentials, site_events, sync_log + RLS

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- products
-- Espelho local dos anúncios do Mercado Livre. Fonte da verdade é o ML;
-- este site nunca escreve preço/estoque/status aqui a partir do próprio site,
-- só via sync (carga inicial / webhook / cron).
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  ml_item_id text not null unique,
  title text not null,
  price numeric(10, 2) not null,
  stock integer not null default 0,
  status text not null default 'active',
  images jsonb not null default '[]'::jsonb,
  permalink text not null,
  -- categoria interna do site (roletado | admissao | escape | conjunto).
  -- mapeamento a partir dos dados do ML ainda será definido na etapa 5.
  category text,
  brand text,
  engine text,
  applications jsonb not null default '[]'::jsonb,
  ml_updated_at timestamptz,
  synced_at timestamptz,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_brand_idx on public.products (brand);
create index products_category_idx on public.products (category);
create index products_visibility_idx on public.products (status, stock, hidden);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

alter table public.products enable row level security;

-- Público só enxerga produto ativo, com estoque e não oculto pelo CMS.
create policy "public can read visible products"
  on public.products
  for select
  to anon, authenticated
  using (status = 'active' and stock > 0 and hidden = false);

-- ---------------------------------------------------------------------------
-- ml_credentials
-- Tokens OAuth do Mercado Livre. Só o service role acessa (RLS sem policy
-- para anon/authenticated = acesso negado por padrão). Nunca expor ao client.
-- ---------------------------------------------------------------------------
create table public.ml_credentials (
  seller_id bigint primary key,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ml_credentials_set_updated_at
  before update on public.ml_credentials
  for each row
  execute function public.set_updated_at();

alter table public.ml_credentials enable row level security;
-- Nenhuma policy: anon/authenticated não têm acesso. Service role bypassa RLS.

-- ---------------------------------------------------------------------------
-- site_events
-- Analytics próprio (pageview, product_view, buy_click). Gravado só pelo
-- servidor (rota /go/[id] e endpoint de tracking) usando service role,
-- nunca por escrita direta do browser — por isso nenhuma policy de insert
-- para anon/authenticated aqui.
-- ---------------------------------------------------------------------------
create table public.site_events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('pageview', 'product_view', 'buy_click')),
  product_id uuid references public.products (id) on delete set null,
  session_id text not null,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index site_events_created_at_idx on public.site_events (created_at);
create index site_events_type_idx on public.site_events (type);
create index site_events_product_id_idx on public.site_events (product_id);

alter table public.site_events enable row level security;
-- Nenhuma policy: leitura/escrita só via service role (rotas server-side e
-- futuro /admin). Revisitar na etapa 8 quando o auth de admin existir.

-- ---------------------------------------------------------------------------
-- sync_log
-- Auditoria de cada upsert de produto vindo do ML (initial | webhook | cron).
-- Escrito só pelo backend (Edge Functions / cron), nunca pelo client.
-- ---------------------------------------------------------------------------
create table public.sync_log (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('webhook', 'cron', 'initial')),
  ml_item_id text,
  result text not null check (result in ('success', 'error', 'skipped')),
  error text,
  created_at timestamptz not null default now()
);

create index sync_log_created_at_idx on public.sync_log (created_at);
create index sync_log_ml_item_id_idx on public.sync_log (ml_item_id);

alter table public.sync_log enable row level security;
-- Nenhuma policy: leitura/escrita só via service role.
