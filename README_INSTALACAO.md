# EventHub — atualização de e-mail SMTP/Gmail

Este pacote adiciona:

- Resend, Gmail, Microsoft 365 e SMTP personalizado;
- cadastro da configuração em `/admin/configuracoes/email`;
- senha SMTP criptografada com AES-256-GCM antes de ser salva no Neon;
- teste de envio;
- rota de disparo de convites usando o provedor escolhido;
- preservação do HTML criado pelo modelador de e-mail.

## 1. Copiar os arquivos

Extraia o conteúdo sobre a raiz do EventHub. Revise arquivos que já existam antes de substituir.

## 2. Dependências

```powershell
npm install nodemailer
npm install -D @types/nodemailer
```

## 3. Variável obrigatória

Na Vercel e no `.env.local`, crie:

```env
EVENTHUB_SETTINGS_ENCRYPTION_KEY=UMA_CHAVE_FORTE_E_ALEATORIA
```

A mesma chave deve permanecer estável. Se ela for alterada, as senhas SMTP já cadastradas não poderão ser descriptografadas.

## 4. Gmail

No painel, selecione `Gmail pessoal / Google Workspace`, informe o endereço Gmail como usuário SMTP e use uma **senha de app**, não a senha normal da conta.

Configuração aplicada automaticamente:

- Host: `smtp.gmail.com`
- Porta: `587`
- STARTTLS: habilitado

## 5. Microsoft 365

Configuração aplicada automaticamente:

- Host: `smtp.office365.com`
- Porta: `587`
- STARTTLS: habilitado

A autenticação SMTP precisa estar permitida para a caixa postal.

## 6. Rotas

- Configuração: `/admin/configuracoes/email`
- API de configuração: `/api/configuracoes`
- Teste: `/api/configuracoes/email/testar`
- Envio: `/api/eventos/[id]/enviar`

## 7. Build

```powershell
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm run build
git add .
git commit -m "feat: adiciona Gmail e SMTP ao EventHub"
git push origin main
```

## Segurança

- A API nunca devolve a senha SMTP ao navegador.
- A senha é criptografada antes de ser armazenada no JSONB.
- Não registre a senha ou a URL completa do banco em logs.
- Para alto volume, prefira Resend ou outro provedor transacional.
