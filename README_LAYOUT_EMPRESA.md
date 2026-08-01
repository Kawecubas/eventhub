# EventHub — Ambiente único da empresa contratante

## Arquivos incluídos

- `lib/company-settings.ts`
- `app/api/configuracoes/route.ts`
- `app/admin/layout.tsx`
- `app/admin/components/AdminShell.tsx`
- `app/admin/admin-shell.css`
- `app/admin/dashboard/*`
- `app/admin/configuracoes/*`
- `app/admin/login/*`

## Rotas

- `/admin/login`
- `/admin/dashboard`
- `/admin/eventos`
- `/admin/configuracoes`

## Banco

A tabela `eventhub_settings` é criada automaticamente no Neon no primeiro acesso. Ela contém um único registro, `company`, com os dados e a identidade da empresa contratante.

## Aplicação

Copie as pastas do ZIP sobre a raiz do projeto. Depois execute:

```powershell
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run build
```

Depois publique no GitHub/Vercel.

## Imagens

Nesta etapa, logo, favicon e imagem de login são URLs públicas. Para upload direto no painel, conecte Vercel Blob ou Supabase Storage em uma próxima versão.
