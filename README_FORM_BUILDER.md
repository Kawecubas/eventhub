# EventHub — Editor de Formulário

Este pacote adiciona um editor configurável por evento.

## Nova rota administrativa

```text
/admin/eventos/[id]/formulario
```

## Tipos disponíveis

- Somente texto
- Texto curto
- Texto longo
- Lista de opções
- Caixa de seleção
- Datas do evento
- Quantidade de participantes
- Observações

## Arquivos alterados

```text
lib/event-platform-store.ts
app/admin/eventos/[id]/EventNavigation.tsx
app/admin/eventos/[id]/formulario/page.tsx
app/admin/eventos/[id]/formulario/FormBuilder.tsx
app/admin/eventos/[id]/formulario/form-builder.css
app/eventos/[slug]/EventResponse.tsx
app/eventos/[slug]/page.tsx
app/eventos/[slug]/form-builder-public.css
```

Os eventos antigos recebem automaticamente os campos padrão de data, quantidade e observação.

## Aplicação

Extraia o ZIP sobre a raiz do projeto e execute:

```powershell
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm run build
npm run dev
```
