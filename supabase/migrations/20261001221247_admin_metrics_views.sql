-- Etapa 8 (parte B): views de métricas pro dashboard do /admin.
--
-- Nenhuma dessas views é security definer, então continuam respeitando a
-- RLS das tabelas de baixo: site_events só é legível por admin
-- (is_admin()), e products já tem a policy "admin can read all products"
-- que libera tudo (inclusive pausado/sem estoque/oculto) pra quem é
-- admin. Um authenticated comum que não é admin recebe resultado vazio,
-- nunca um erro — a RLS filtra as linhas, não bloqueia a query.

create view public.v_visits_by_day as
select date_trunc('day', created_at)::date as day, count(*) as visits
from public.site_events
where type = 'pageview'
group by 1
order by 1 desc;

create view public.v_top_viewed_products as
select p.ml_item_id, p.title, count(*) as views
from public.site_events e
join public.products p on p.id = e.product_id
where e.type = 'product_view'
group by p.ml_item_id, p.title
order by views desc;

create view public.v_buy_clicks_by_product as
select p.ml_item_id, p.title, count(*) as clicks
from public.site_events e
join public.products p on p.id = e.product_id
where e.type = 'buy_click'
group by p.ml_item_id, p.title
order by clicks desc;

create view public.v_traffic_sources as
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
