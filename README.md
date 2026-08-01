# Comprovante de confirmação

## Arquivos

1. Substitua `app/eventos/[slug]/EventResponse.tsx`.
2. Copie `app/eventos/[slug]/comprovante.css`.
3. No `app/eventos/[slug]/page.tsx`, mantenha o `public.css` e adicione:

```tsx
import "./comprovante.css";
```

## Dependência do QR Code

```bash
npm install qrcode
npm install -D @types/qrcode
```

## Agenda

Os links Google Agenda e Outlook aparecem quando a data escolhida contém `DD/MM/AAAA`. O horário é identificado em textos como `19:30`, `19h30` ou `às 19h`. Se não houver horário, o padrão será 09:00 e duração de duas horas.

Depois execute:

```bash
npm run build
git add .
git commit -m "feat: adiciona comprovante, QR Code e agenda"
git push origin main
```
