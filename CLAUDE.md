@AGENTS.md

# Casa dos Balancim: contexto do projeto

Leia este arquivo inteiro antes de qualquer tarefa. Ele descreve o que estamos construindo, as decisões já tomadas e a ordem de trabalho. Se algo aqui conflitar com o que você encontrar no código, pergunte antes de assumir.

## O que é

Vitrine web com painel de métricas para a **Casa dos Balancim** (Instagram @casadosbalancim), loja especializada em **balancins de válvula** (roletados, admissão e escape, conjunto eixo + balancins) para linhas GM, Renault, MWM, Mitsubishi, Mercedes-Benz, Audi, Fiat, Volkswagen, Suzuki e Ford.

O cliente **já vende no Mercado Livre**. O site **não vende**: ele espelha os anúncios do ML e leva o visitante para o anúncio quando clica em "Comprar".

## Decisões já tomadas (não reabrir sem motivo)

1. **Mercado Livre é a fonte da verdade** para produto, preço, estoque e status. O site nunca edita esses dados, só lê.
2. **Sem checkout, carrinho ou pagamento.** "Comprar" leva ao anúncio no ML.
3. **Botão Comprar passa por um redirect rastreado**: `/go/[id]` grava um evento em `site_events` e responde 302 para o `permalink` do anúncio. Nenhum link do site aponta direto para o ML.
4. **Sincronização**: webhooks do ML como fonte principal + cron de reconciliação como rede de segurança.
5. **Produtos com estoque 0 ou `status != active` não aparecem na vitrine.**
6. **Visual gerado no v0** (Next.js App Router + Tailwind + shadcn/ui), já baixado neste repositório com produtos fictícios.
7. **Painel do cliente (`/admin`)** no mesmo projeto Next, com Supabase Auth, mostrando métricas e permitindo editar conteúdo que o ML não tem (banners, textos, destaques, produtos ocultos).

## Stack

- **Front/painel:** Next.js (App Router), TypeScript, Tailwind, shadcn/ui
- **Banco/Auth/Functions:** Supabase (Postgres, Auth, Edge Functions, pg_cron)
- **Integração:** API do Mercado Livre (OAuth 2.0 + notificações)
- **Deploy:** Vercel (Next) + Supabase hospedado
- **Repositório:** GitHub (`Menzomo/vitrine-casa-dos-balancim`), conectado ao projeto Vercel. Projeto Supabase já criado.

## Estado atual

- O v0 gerou o visual completo (home, `/produtos`, `/produtos/[id]`, rota placeholder `/go/[id]`).
- O v0 também criou um **catálogo por marca/montadora** (GM, Renault, MWM, Mitsubishi, Mercedes-Benz, Audi, Fiat, Volkswagen, Suzuki, Ford), baseado nos destaques do Instagram. **Ainda não sabemos se o cliente tem produtos de todas essas marcas ou só de algumas.** Isso será avaliado depois da carga inicial: não remova nem altere nenhuma marca agora, e não presuma que a lista atual está correta.
- **Todas as páginas leem dados por funções de `lib/products.ts`** (`getProducts`, `getProductById`, `getBrands`...), com 24 produtos fictícios. A integração consiste em **trocar a implementação dessas funções por consultas ao Supabase, sem mexer nos componentes**. Preserve essa camada.
- O tipo `Product` atual: `id`, `title`, `price`, `stock`, `status`, `images`, `permalink`, `category`, `brand`, `engine`, `applications[]`, `createdAt`, `updatedAt`. Se o schema do banco divergir, adapte no `lib/`, não nos componentes.
- Projeto criado no DevCenter do Mercado Livre; tópico de notificação `items` já ativo. `ML_CLIENT_ID`, `ML_CLIENT_SECRET` e `ML_REDIRECT_URI` já estão configuradas na Vercel (Production) — nunca ler, imprimir ou commitar valores de `.env*`.
- Schema/migrations do Supabase: etapa em andamento (ver `supabase/migrations/`).
- **Ainda não feito:** OAuth com o ML, carga inicial, webhook, cron, métricas, `/admin`.

## Arquitetura da integração com o ML

### OAuth (uma vez por cliente)
- A app é registrada no DevCenter do ML (client_id, client_secret, redirect URI).
- O dono da conta do ML abre o link de autorização, aprova, e o ML redireciona para `/api/ml/callback?code=...`.
- O back troca o `code` por `access_token` + `refresh_token` (`POST https://api.mercadolibre.com/oauth/token`).
- **O access token dura cerca de 6h. O refresh token é de uso único**: a cada refresh vem um novo que precisa ser salvo imediatamente. Se salvar errado, o acesso se perde e o cliente precisa reautorizar.
- Centralize o refresh em UMA função (`getValidMlToken()`), com proteção contra refresh concorrente (lock ou transação), e use-a em todo lugar.
- Tokens ficam em `ml_credentials`, acessível **apenas por service role**. Nunca expor ao client, nunca logar.

### Carga inicial
- `GET /users/{seller_id}/items/search` paginado, depois `GET /items?ids=...` em lotes de até 20.
- Upsert em `products` pela chave `ml_item_id`.

### Webhook (tempo real)
- Tópico assinado: `items`. O ML faz POST com o recurso alterado (ex.: `/items/MLB123...`).
- Endpoint (Supabase Edge Function): valida o corpo, **responde 200 rápido**, busca `GET /items/{id}`, faz upsert em `products` e registra em `sync_log`.
- Depois do upsert, chama `POST /api/revalidate` do Next (protegido por segredo) com `revalidateTag` para atualizar o cache da página do produto.

### Cron de reconciliação
- A cada 15–30 min (pg_cron ou n8n): reconcilia todos os produtos, corrige o que o webhook perdeu e marca como pausado/ausente o que sumiu do ML. Registra em `sync_log` a origem de cada correção (`webhook` ou `cron`).

> Confira a documentação oficial do ML (developers.mercadolivre.com.br) antes de implementar cada endpoint: campos, limites e formatos de notificação mudam. Não confie só na memória.

## Schema (proposta inicial, ajuste conforme necessário)

- `products`: `ml_item_id` (unique), `title`, `price`, `stock`, `status`, `images` (jsonb), `permalink`, `category`, `brand`, `engine`, `applications` (jsonb), `ml_updated_at`, `synced_at`, `hidden` (bool, controlado pelo CMS)
- `ml_credentials`: `seller_id`, `access_token`, `refresh_token`, `expires_at`
- `site_events`: `id`, `type` (`pageview` | `product_view` | `buy_click`), `product_id`, `session_id` (anônimo), `referrer`, `utm_*`, `user_agent`, `created_at`
- `sync_log`: `id`, `source` (`webhook` | `cron` | `initial`), `ml_item_id`, `result`, `error`, `created_at`
- Tabelas do CMS (`site_settings`, `banners`, `featured_products`): definir quando chegarmos lá.
- **Migrations versionadas em `supabase/migrations/`.** Nada de alterar schema manualmente no dashboard.

`category`, `brand`, `engine` e `applications` não existem como campos nativos do Mercado Livre — vêm de atributos/título do anúncio (parser futuro) ou de classificação manual via CMS. Ao evoluir o schema, prever: colunas nullable + um jsonb `ml_attributes` (dados brutos do ML para o parser) + um jsonb `manual_overrides` (marca quais campos foram setados manualmente, para o sync nunca sobrescrever). O ID público usado em `/produtos/[id]` e `/go/[id]` é o `ml_item_id` (PK interna continua sendo um `uuid`, usado para joins como `site_events.product_id`).

## Segurança e RLS

- RLS ligada em todas as tabelas.
- Público (anon): só `SELECT` em `products` onde `status = 'active' AND stock > 0 AND hidden = false`. Nada mais.
- `site_events`: inserção só via server (rota `/go/[id]` e endpoint de tracking), nunca escrita direta do browser.
- Métricas e CMS: só usuário admin autenticado. Identificação de admin via tabela `admin_users (user_id uuid references auth.users(id))`, checada nas policies com `exists (select 1 from admin_users where user_id = auth.uid())`.
- `SUPABASE_SERVICE_ROLE_KEY`, `ML_CLIENT_SECRET` e tokens: **somente server-side**, nunca com prefixo `NEXT_PUBLIC_`, nunca commitados.
- Verifique a autenticidade do webhook (o que o ML permitir: IPs, `user_id`/`application_id` esperados) e nunca confie cegamente no payload: sempre rebusque o item via API.

## Métricas e `/admin`

- Eventos: pageview, visualização de produto, clique em Comprar (via `/go/[id]`), com referrer/UTM e `session_id` anônimo (cookie próprio, sem dado pessoal).
- Dashboard: visitas por dia, produtos mais vistos, cliques em Comprar por produto, origem do tráfego. Agregar com views SQL.
- **Limitação a manter clara para o cliente:** medimos o clique que saiu para o ML, **não a venda concluída**. O ML não informa a origem da visita.
- CMS: banners, textos institucionais, produtos em destaque, ordem e ocultação de produtos.

## Ordem de trabalho

1. **Schema + migrations** no Supabase e RLS.
2. **Cliente Supabase** no Next (server e client separados) e variáveis de ambiente (`.env.example` documentado, `.env.local` fora do git).
3. Cadastro da app no DevCenter do ML (feito manualmente pelo Bruno) e **fluxo OAuth** (`/api/ml/connect`, `/api/ml/callback`, `getValidMlToken`).
4. **Carga inicial** de produtos. Ao terminar, gere um relatório de **quantos produtos ativos existem por marca** e me mostre, para eu decidir quais marcas ficam no catálogo.
5. **Trocar `lib/products.ts`** por consultas ao Supabase, mantendo as mesmas assinaturas. Implemente `getBrands()` de forma que a lista de marcas possa vir dos dados reais (marcas com ao menos um produto ativo), para que marcas sem produto não apareçam como página vazia. Só aplique isso depois que eu aprovar o relatório da etapa 4.
6. **Rota `/go/[id]`** real com gravação de evento e 302.
7. **Webhook** (Edge Function) + `/api/revalidate` + **cron** de reconciliação.
8. **Eventos de métricas** e `/admin` com auth.
9. **CMS** (banners, destaques, ocultar produtos).
10. Revisão final: SEO, performance, RLS, tratamento de erro, deploy.

Trabalhe **uma etapa por vez** e confirme comigo antes de passar para a próxima.

## Convenções

- TypeScript estrito, sem `any` sem justificativa.
- Textos da interface em **português do Brasil**. Código, nomes de variáveis e commits em inglês.
- Commits pequenos e descritivos (Conventional Commits).
- Não instalar dependência nova sem dizer o porquê.
- Não reescrever o visual gerado pelo v0 sem eu pedir. Se precisar mexer em componente, faça a menor mudança possível.
- Tratar falha de rede/API do ML com retry e log, nunca deixando a vitrine quebrar: se o sync falhar, o site continua servindo o último dado salvo.
- Antes de rodar algo destrutivo (reset de banco, delete em massa, force push), pergunte.

## Identidade visual (referência)

Dourado `#B58A2E` (principal) e `#D4B05A` (claro), preto `#111111`, fundo branco e `#FAF8F3`, cinza aço `#E7E7E5` / `#6B6B6B`. Poppins nos títulos, Inter no corpo. Estilo limpo, técnico e confiável.

## Como me ajudar melhor

- Se faltar uma informação (credencial, decisão de negócio, formato de dado), **pergunte em vez de inventar**.
- Ao terminar cada etapa, resuma o que mudou, o que testou e o que ficou pendente.
- Se encontrar risco (segurança, perda de dado, custo), avise antes de seguir.
