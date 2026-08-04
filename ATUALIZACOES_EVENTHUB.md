# Atualizações realizadas

## Eventos

- Dashboard do evento movido para `/admin/eventos/[id]/dashboard`.
- Página `/admin/eventos/[id]` ficou dedicada ao gerenciamento.
- Adicionado menu interno com Dashboard, Gerenciar evento, Personalizar e-mail, Selecionar template e Configurações.
- Lista de eventos agora possui botões separados para Dashboard e Gerenciamento.

## Exclusão

- Exclusão removida da tela principal do evento.
- Nova rota de configurações: `/admin/eventos/[id]/configuracoes`.
- Nova rota exclusiva para exclusão: `/admin/eventos/[id]/configuracoes/excluir`.

## Designer de e-mail

- Corrigida saudação duplicada.
- Adicionada opção para exibir ou ocultar a saudação automática.
- Se o texto começar com `Olá, {{nome}}`, o gerador remove essa repetição quando a saudação automática estiver ativada.
- Adicionado rodapé HTML configurável com logo, título, texto, endereço, e-mail, telefone, site e cores.

## Aplicação

Extraia o ZIP sobre a raiz do projeto e substitua os arquivos existentes. Depois execute:

```powershell
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm run build
npm run dev
```
