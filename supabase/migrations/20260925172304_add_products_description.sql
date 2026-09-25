-- Descrição livre do anúncio no ML (GET /items/{id}/description), usada na
-- página do produto como conteúdo real quando não há "applications"
-- estruturadas ainda (a extração de compatibilidade é mais limitada).
alter table public.products
  add column description text;
