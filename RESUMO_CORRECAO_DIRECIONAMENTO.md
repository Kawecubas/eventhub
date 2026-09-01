# Correção do direcionamento dos convites

## Problema identificado

O projeto apresentava dois problemas no fluxo de convite. O endpoint `PATCH` do editor de formulário estava dentro de `app/admin/eventos/[id]/formulario/route.ts`, enquanto a página administrativa ocupava o mesmo caminho. O Next.js interpretava os dois arquivos como páginas paralelas para a mesma URL e o build falhava.

Além disso, a resolução do convite dependia de uma comparação frágil do slug e do token. O slug público não era normalizado da mesma forma que o slug armazenado, e o token era lido diretamente sem tratamento para valores codificados ou malformados.

## Correções aplicadas

| Arquivo | Alteração |
|---|---|
| `app/admin/eventos/[id]/formulario/route.ts` | Movido para `app/api/eventos/[id]/formulario/route.ts`, que corresponde ao caminho usado pelo `fetch` do editor. |
| `lib/event-platform-store.ts` | Adicionada decodificação segura de valores de URL; `getEventBySlug` e `findGuest` passaram a normalizar o slug com a mesma regra usada no armazenamento. |
| `app/eventos/[slug]/page.tsx` | Mantida a página pública e explicitado o tipo `CSSProperties`. |
| `app/api/eventos/[id]/enviar/route.ts` | Corrigido o import de `NextResponse`; links passaram a codificar slug e token com `encodeURIComponent`; a URL base não recebe barra duplicada; quando `guestIds` não é enviado, são selecionados os convidados pendentes. |

## Validação

O comando `npm run build` foi executado com sucesso. O projeto compilou, passou pela verificação de tipos e gerou todas as rotas, incluindo:

- `/eventos/[slug]`
- `/api/eventos/[id]/formulario`
- `/api/eventos/[id]/enviar`
- `/api/eventos/[id]/responder`

O build ainda exibe apenas um aviso de autoprefixer em um CSS administrativo; esse aviso não impede a compilação nem está relacionado ao direcionamento dos convites.

## Resultado esperado

Os links enviados no formato `/eventos/openhouse?token=...` devem localizar o evento e o convidado corretamente. O agrupamento de datas e horários permanece preservado, pois a correção atua somente na rota, na geração do link e na resolução do convite.
