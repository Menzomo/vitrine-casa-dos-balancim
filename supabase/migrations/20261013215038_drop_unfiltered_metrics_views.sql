-- As 4 views de métricas (etapa 8) não aceitavam filtro de período —
-- o dashboard do /admin agora consulta site_events direto, com data de
-- início/fim escolhida pelo usuário, substituindo essas views por completo.
drop view if exists public.v_visits_by_day;
drop view if exists public.v_top_viewed_products;
drop view if exists public.v_buy_clicks_by_product;
drop view if exists public.v_traffic_sources;
