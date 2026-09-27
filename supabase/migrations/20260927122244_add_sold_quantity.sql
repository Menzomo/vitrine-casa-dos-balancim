-- Quantidade vendida do anúncio no ML (item.sold_quantity), usada pra
-- destacar de verdade os produtos que mais vendem (seção "Mais vendidos"
-- na home), em vez de fixar isso manualmente.
alter table public.products
  add column sold_quantity integer not null default 0;

create index products_sold_quantity_idx on public.products (sold_quantity desc);
