-- Etapa 7: cron de reconciliação. Chama /api/ml/reconcile a cada 20min
-- via pg_cron + pg_net, autenticado com um segredo guardado no Supabase
-- Vault (nunca em texto puro em código versionado).
--
-- O segredo em si NÃO é criado aqui — foi inserido uma única vez via
-- `supabase db query` com `select vault.create_secret(<valor>, 'ml_reconcile_secret', ...)`,
-- rodado direto contra o banco, fora do histórico de migrations. Pra
-- rotacionar, use `select vault.update_secret(id, <novo valor>)` do mesmo jeito
-- (e atualize a variável ML_RECONCILE_SECRET na Vercel com o mesmo valor).

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'ml-reconcile') then
    perform cron.schedule(
      'ml-reconcile',
      '*/20 * * * *',
      $cron$
      select net.http_post(
        url := 'https://vitrine-casa-dos-balancim-theta.vercel.app/api/ml/reconcile',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (
            select decrypted_secret from vault.decrypted_secrets where name = 'ml_reconcile_secret'
          )
        ),
        body := '{}'::jsonb
      );
      $cron$
    );
  end if;
end;
$$;
