# EventHub — menus e templates de e-mail

Este patch adiciona:

## Menu global de comunicação

- `/admin/templates`
- `/admin/templates/novo`
- `/admin/templates/[id]`
- `/admin/configuracoes/email` — rota já existente no projeto

## Menu dentro do evento

- `/admin/eventos/[id]/email`
- `/admin/eventos/[id]/email/selecionar-template`
- acesso à área de convidados/envio

## Banco Neon

A tabela é criada automaticamente:

```sql
CREATE TABLE IF NOT EXISTS eventhub_email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Ajuste obrigatório em EventItem

Confirme em `lib/event-platform-store.ts`:

```ts
emailHtml?: string;
```

No `normalizeEvent()`:

```ts
emailHtml: String(source.emailHtml ?? ""),
```

## Sidebar

Use o conteúdo de `SIDEBAR_MENU_SNIPPET.tsx` como referência e copie os dois links para sua sidebar atual.

## Página do evento

Use `EVENT_PAGE_SNIPPET.tsx` para inserir o menu de comunicação dentro do evento.

## Build

```powershell
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm run build
```
