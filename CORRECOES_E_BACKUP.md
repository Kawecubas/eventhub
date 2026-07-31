# EventHub — Neon, build e backup

## Correções incluídas

- Todas as páginas e rotas aguardam (`await`) as operações assíncronas do Neon.
- `@neondatabase/serverless` está declarado em `package.json`.
- O EventHub não grava mais em `data/eventos.json` na Vercel.
- Exportação de todos os eventos, datas, convidados e respostas em arquivo TXT com JSON válido.
- Importação de backup com os modos **Mesclar** e **Substituir**.

## Instalação

```powershell
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue
npm install
npm run build
```

O `npm install` é obrigatório porque adiciona o driver `@neondatabase/serverless`.

## Variáveis aceitas

A aplicação busca a conexão nesta ordem:

1. `event_hub_POSTGRES_URL`
2. `DATABASE_URL`
3. `event_hub_DATABASE_URL_UNPOOLED`
4. `event_hub_POSTGRES_URL_NON_POOLING`
5. `eventhub_POSTGRES_URL`
6. `eventhub_POSTGRES_PRISMA_URL`

Também são usadas:

- `EVENTHUB_ADMIN_PASSWORD`
- `EVENTHUB_ADMIN_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY` (opcional, para e-mails)

## Backup

No painel de eventos:

- **Exportar backup** baixa um arquivo `eventhub-backup-AAAA-MM-DD....txt`.
- **Importar backup** aceita `.txt` ou `.json`.
- O arquivo é texto e contém JSON válido.

O modo **Mesclar** atualiza eventos com o mesmo ID e mantém os demais.
O modo **Substituir** apaga os eventos atuais antes da restauração.
