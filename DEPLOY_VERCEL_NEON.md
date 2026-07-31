# Deploy do EventHub na Vercel com Neon

## Variáveis já suportadas

O projeto procura a conexão nesta ordem:

1. `event_hub_POSTGRES_URL` (Neon conectado à Vercel)
2. `DATABASE_URL`
3. `event_hub_DATABASE_URL_UNPOOLED`
4. `event_hub_POSTGRES_URL_NON_POOLING`
5. `eventhub_POSTGRES_URL` (fallback Supabase)
6. `eventhub_POSTGRES_PRISMA_URL`

Para autenticação, utiliza:

- `EVENTHUB_ADMIN_PASSWORD`
- `EVENTHUB_ADMIN_SECRET`
- `NEXT_PUBLIC_APP_URL`

## Publicação

```powershell
npm install
npm run build
git add .
git commit -m "fix: migra persistencia para Neon"
git push origin main
```

O novo push inicia automaticamente um deployment na Vercel.

## Banco

A tabela `eventhub_events` é criada automaticamente no primeiro acesso à API. Eventos, datas, convidados e respostas são salvos em PostgreSQL usando JSONB. Não há gravação em `data/eventos.json` na produção.

## Teste

1. Entre em `/admin/login`.
2. Crie um evento.
3. Cadastre ou importe um convidado.
4. Atualize a página.
5. Confirme que os dados permanecem após um novo deployment.
