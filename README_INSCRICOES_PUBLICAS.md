# Inscrições públicas e check-in

## Uso

1. Crie e salve o evento no painel administrativo.
2. Em **Dados do evento**, use **Gerar link sem convidado** e divulgue a URL retornada.
3. A pessoa abre `/eventos/<slug>/inscrever`, escolhe PT-BR, EN, ES ou IT e conclui o formulário.
4. A confirmação é enviada por e-mail com um QR Code individual. O leitor em `/admin/eventos/<id>/checkin` registra o token uma única vez e avisa quando ele já foi usado.

## Ambiente

Defina `DATABASE_URL` (ou uma das variáveis Neon já suportadas) e `NEXT_PUBLIC_APP_URL` com a URL pública do projeto. Para enviar a confirmação, configure o provedor em **Administração > Configurações > E-mail** e mantenha `EVENTHUB_SETTINGS_ENCRYPTION_KEY` estável.

Se não houver SMTP/Resend válido, a inscrição ainda é gravada; o envio do e-mail é registrado no log do servidor e pode ser repetido após corrigir a configuração.
