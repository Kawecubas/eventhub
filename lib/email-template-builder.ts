export type VisualEmailTemplateInput = {
  assetUrl: string;
  altText: string;
  preheader: string;
  heading: string;
  body: string;
  ctaLabel: string;
  primaryColor: string;
  backgroundColor: string;
  footer: string;
};

function escapeHtml(value: string): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function paragraphs(value: string): string {
  return escapeHtml(value)
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(
      (part) =>
        `<p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.65;">${part.replaceAll(
          "\n",
          "<br>"
        )}</p>`
    )
    .join("");
}

export function buildVisualEmailHtml(input: VisualEmailTemplateInput): string {
  const primaryColor = /^#[0-9a-f]{6}$/i.test(input.primaryColor)
    ? input.primaryColor
    : "#173b57";
  const backgroundColor = /^#[0-9a-f]{6}$/i.test(input.backgroundColor)
    ? input.backgroundColor
    : "#f3f6f9";

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(input.heading || "{{evento}}")}</title>
  </head>
  <body style="margin:0;padding:0;background:${backgroundColor};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(
      input.preheader
    )}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${backgroundColor};">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;box-shadow:0 10px 30px rgba(16,24,40,.08);">
            <tr>
              <td style="padding:0;">
                <img src="${escapeHtml(input.assetUrl)}" alt="${escapeHtml(
    input.altText
  )}" width="640" style="display:block;width:100%;max-width:640px;height:auto;border:0;outline:none;text-decoration:none;">
              </td>
            </tr>
            <tr>
              <td style="padding:34px 34px 26px;">
                <p style="margin:0 0 12px;color:#667085;font-size:14px;line-height:1.5;">Olá, <strong>{{nome}}</strong>.</p>
                <h1 style="margin:0 0 18px;color:#101828;font-size:28px;line-height:1.2;">${escapeHtml(
                  input.heading || "{{evento}}"
                )}</h1>
                ${paragraphs(input.body)}
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
                  <tr>
                    <td bgcolor="${primaryColor}" style="border-radius:9px;">
                      <a href="{{link}}" target="_blank" style="display:inline-block;padding:15px 24px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;border-radius:9px;">${escapeHtml(
                        input.ctaLabel || "Confirmar participação"
                      )}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:28px 0 0;color:#667085;font-size:12px;line-height:1.6;">Este convite é individual. Caso o botão não funcione, copie e cole este endereço no navegador:<br><a href="{{link}}" style="color:${primaryColor};word-break:break-all;">{{link}}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 34px;background:#f8fafc;border-top:1px solid #eaecf0;color:#667085;font-size:12px;line-height:1.5;text-align:center;">${escapeHtml(
                input.footer
              )}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function replaceEmailVariables(
  template: string,
  values: Record<string, string>
): string {
  return Object.entries(values).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value ?? ""),
    template
  );
}
