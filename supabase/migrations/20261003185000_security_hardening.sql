-- Etapa 10: correções encontradas pelo `supabase db advisors`.
--
-- 1) ERROR — Security Definer View. Views do Postgres, por padrão, rodam
--    com o privilégio de quem CRIOU a view (não de quem está consultando),
--    exceto quando criadas com security_invoker=true. As 4 views de
--    métricas foram criadas sem isso, então qualquer usuário autenticado
--    (não só admin) conseguiria ler site_events/products por completo
--    através delas, ignorando a RLS que protege as tabelas de baixo.
--    Recriar com security_invoker=true corrige isso: a view passa a
--    respeitar a RLS de quem está consultando, como já era a intenção.
drop view if exists public.v_visits_by_day;
drop view if exists public.v_top_viewed_products;
drop view if exists public.v_buy_clicks_by_product;
drop view if exists public.v_traffic_sources;

create view public.v_visits_by_day
with (security_invoker = true) as
select date_trunc('day', created_at)::date as day, count(*) as visits
from public.site_events
where type = 'pageview'
group by 1
order by 1 desc;

create view public.v_top_viewed_products
with (security_invoker = true) as
select p.ml_item_id, p.title, count(*) as views
from public.site_events e
join public.products p on p.id = e.product_id
where e.type = 'product_view'
group by p.ml_item_id, p.title
order by views desc;

create view public.v_buy_clicks_by_product
with (security_invoker = true) as
select p.ml_item_id, p.title, count(*) as clicks
from public.site_events e
join public.products p on p.id = e.product_id
where e.type = 'buy_click'
group by p.ml_item_id, p.title
order by clicks desc;

create view public.v_traffic_sources
with (security_invoker = true) as
select
  coalesce(
    utm_source,
    case
      when referrer is null or referrer = '' then 'direto'
      when referrer ilike '%instagram%' then 'instagram'
      when referrer ilike '%google%' then 'google'
      when referrer ilike '%facebook%' or referrer ilike '%fb.%' then 'facebook'
      when referrer ilike '%whatsapp%' or referrer ilike '%wa.me%' then 'whatsapp'
      else 'outro site'
    end
  ) as origem,
  count(*) as eventos
from public.site_events
where type = 'pageview'
group by 1
order by eventos desc;

grant select on public.v_visits_by_day to authenticated;
grant select on public.v_top_viewed_products to authenticated;
grant select on public.v_buy_clicks_by_product to authenticated;
grant select on public.v_traffic_sources to authenticated;

-- 2) WARN — Function Search Path Mutable. Funções sem search_path fixo
--    são vulneráveis a um ataque de "search_path hijacking" (alguém cria
--    um objeto com o mesmo nome em outro schema que entra na frente na
--    busca). Mesmo essas duas sendo só triggers simples, não security
--    definer, é barato fixar.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_updated_at_generic()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3) WARN — Multiple Permissive Policies. Ter uma policy "público pode
--    ler X" e outra "admin pode ler tudo" separadas faz o Postgres
--    avaliar as duas em toda consulta de um usuário autenticado
--    (desperdício, mesmo resultado). Unifica numa policy só por papel.
drop policy "public can read visible products" on public.products;
drop policy "admin can read all products" on public.products;

create policy "anon can read visible products"
  on public.products
  for select
  to anon
  using (status = 'active' and stock > 0 and hidden = false);

create policy "authenticated can read products"
  on public.products
  for select
  to authenticated
  using (public.is_admin() or (status = 'active' and stock > 0 and hidden = false));

drop policy "public can read active banners" on public.banners;
drop policy "admin can read all banners" on public.banners;

create policy "anon can read active banners"
  on public.banners
  for select
  to anon
  using (active = true);

create policy "authenticated can read banners"
  on public.banners
  for select
  to authenticated
  using (public.is_admin() or active = true);

-- featured_products e site_settings tinham a sobreposição porque a
-- policy de admin usava "for all" (que já inclui select) junto com a
-- policy pública de select. Troca o "for all" do admin por
-- insert/update/delete explícitos, mantendo só uma policy de select.
drop policy "admin can write featured products" on public.featured_products;

create policy "admin can insert featured products"
  on public.featured_products
  for insert
  to authenticated
  with check (public.is_admin());

create policy "admin can update featured products"
  on public.featured_products
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin can delete featured products"
  on public.featured_products
  for delete
  to authenticated
  using (public.is_admin());

drop policy "admin can write site settings" on public.site_settings;

create policy "admin can insert site settings"
  on public.site_settings
  for insert
  to authenticated
  with check (public.is_admin());

create policy "admin can update site settings"
  on public.site_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin can delete site settings"
  on public.site_settings
  for delete
  to authenticated
  using (public.is_admin());

-- Nota (não corrigido, intencional): "RLS Enabled No Policy" em
-- admin_users e ml_credentials é o comportamento esperado — essas
-- tabelas só devem ser lidas por service_role ou pela função
-- security-definer is_admin(), nunca diretamente por anon/authenticated.
