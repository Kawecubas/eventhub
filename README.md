# EventHub White Label

Aplicação independente para criação e gestão de eventos. Não contém páginas institucionais, componentes comerciais, logos ou integrações externas do projeto original.

## Teste local

```bash
npm install
copy .env.example .env.local
npm run dev
```

Acesse `http://localhost:3000/admin/login`.

Credencial padrão de desenvolvimento: `admin123`. Troque no `.env.local`.

## Produção

Antes de publicar, configure `EVENT_ADMIN_PASSWORD`, `EVENT_ADMIN_SECRET` e `NEXT_PUBLIC_APP_URL`.

O armazenamento atual usa `data/eventos.json`, indicado apenas para teste local ou servidor com disco persistente. Para Vercel, migre os dados para PostgreSQL/Neon e imagens para Blob Storage.

## Importação de convidados por Excel/CSV

A aba **Convidados** de cada evento permite:

- baixar o modelo oficial em `/modelos/modelo-importacao-convidados.xlsx`;
- importar arquivos `.xlsx`, `.xls` e `.csv`;
- visualizar e validar as linhas antes da carga;
- detectar nome ausente, e-mail inválido e duplicidades no arquivo;
- ignorar convidados já cadastrados ou atualizar seus dados;
- cadastrar convidados válidos em lote, preservando tokens individuais.

Após atualizar o projeto, execute:

```bash
npm install
npm run dev
```

A funcionalidade adiciona a dependência `xlsx`.
