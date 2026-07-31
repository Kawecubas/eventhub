# Correção consolidada do EventHub

Substitua no projeto os quatro arquivos presentes neste pacote:

- `lib/event-platform-store.ts`
- `app/eventos/[slug]/page.tsx`
- `app/eventos/[slug]/EventResponse.tsx`
- `app/api/eventos/[id]/enviar/route.ts`

Principais correções:

- `getEvent()` agora localiza por ID ou slug.
- Link público `/eventos/<slug>?token=<token>` encontra o convidado.
- Tratamento de token ausente ou inválido.
- `EventResponse` aceita `guest=null`, eliminando erro de build.
- Validação da data selecionada.
- Envio para pendentes quando `guestIds` não é informado.
- Fallback do remetente para `EMAIL_FROM`.
- Erros do Resend retornam no JSON e aparecem nos logs.

Depois execute:

```powershell
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run build
git add .
git commit -m "fix: corrige slug, token, respostas e convites"
git push origin main
```
