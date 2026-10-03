-- Etapa 9: CMS — banners, textos institucionais, produtos em destaque.
-- "Ocultar produto" não precisa de tabela nova: products.hidden já existe
-- desde a etapa 1.

create table public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  link_url text,
  image_url text,
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.featured_products (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id)
);

create function public.set_updated_at_generic()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at_generic();

create trigger banners_set_updated_at
  before update on public.banners
  for each row execute function public.set_updated_at_generic();

-- site_settings: leitura pública (o site precisa renderizar os textos),
-- escrita só admin.
alter table public.site_settings enable row level security;

create policy "public can read site settings"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

create policy "admin can write site settings"
  on public.site_settings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- banners: público só vê os ativos; admin vê e edita tudo.
alter table public.banners enable row level security;

create policy "public can read active banners"
  on public.banners
  for select
  to anon, authenticated
  using (active = true);

create policy "admin can read all banners"
  on public.banners
  for select
  to authenticated
  using (public.is_admin());

create policy "admin can write banners"
  on public.banners
  for insert
  to authenticated
  with check (public.is_admin());

create policy "admin can update banners"
  on public.banners
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin can delete banners"
  on public.banners
  for delete
  to authenticated
  using (public.is_admin());

-- featured_products: leitura pública (a home precisa disso pra montar a
-- seção "Destaques"), escrita só admin. Não expõe nada sensível — é só
-- "produto X está em destaque, na posição Y".
alter table public.featured_products enable row level security;

create policy "public can read featured products"
  on public.featured_products
  for select
  to anon, authenticated
  using (true);

create policy "admin can write featured products"
  on public.featured_products
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
