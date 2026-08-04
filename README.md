# Atualização do Email Designer

Este patch:

- remove completamente o uso de PDF.js;
- aceita PNG, JPG/JPEG e WEBP;
- permite upload de PNG para a arte principal;
- permite upload de PNG para a logo do rodapé;
- restaura o editor completo do rodapé;
- adiciona telefone, e-mail, website e redes sociais;
- adiciona cores do rodapé;
- adiciona opção para mostrar ou esconder a saudação automática.

## Arquivos

Substitua:

```text
app/admin/eventos/[id]/email/EmailDesigner.tsx
lib/email-template-builder.ts
app/api/eventos/[id]/email-template/route.ts
```

Copie também:

```text
app/admin/eventos/[id]/email/footer-designer.css
```

No arquivo:

```text
app/admin/eventos/[id]/email/page.tsx
```

adicione:

```ts
import "./footer-designer.css";
```

caso ele ainda não esteja importado por outro CSS.

## Remover PDF.js

```powershell
npm uninstall pdfjs-dist
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm run build
```
