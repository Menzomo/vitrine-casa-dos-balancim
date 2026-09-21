-- Casa dos Balancim: metadados do ML/CMS em products + identificação de admin
--
-- Contexto: category/brand/engine/applications não existem como campos
-- nativos do Mercado Livre (vêm de atributos/título do anúncio ou de
-- classificação manual). Esta migration só abre espaço para isso; o
-- parser/classificador em si é etapa futura.

-- ---------------------------------------------------------------------------
-- products: dados brutos do ML + marcação de overrides manuais do CMS
-- ---------------------------------------------------------------------------
alter table public.products
  add column ml_attributes jsonb not null default '{}'::jsonb,
  add column manual_overrides jsonb not null default '{}'::jsonb;

comment on column public.products.ml_attributes is
  'Atributos/título brutos do item no ML, para uso futuro por um parser/classificador de category/brand/engine/applications.';
comment on column public.products.manual_overrides is
  'Mapa {"campo": true} marcando quais colunas (category, brand, engine, applications) foram setadas manualmente via CMS; o sync deve checar isso antes de sobrescrever.';

-- ---------------------------------------------------------------------------
-- admin_users + is_admin(): identificação de admin para as policies de
-- métricas e CMS. is_admin() é security definer para poder checar
-- admin_users sem precisar expor essa tabela via RLS a nenhum usuário.
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
-- Nenhuma policy: só service role ou a função is_admin() (abaixo) leem.

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Policies de admin: métricas e CMS só para quem estiver em admin_users.
-- ---------------------------------------------------------------------------
create policy "admin can read all products"
  on public.products
  for select
  to authenticated
  using (public.is_admin());

create policy "admin can update products"
  on public.products
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin can read site events"
  on public.site_events
  for select
  to authenticated
  using (public.is_admin());

create policy "admin can read sync log"
  on public.sync_log
  for select
  to authenticated
  using (public.is_admin());
