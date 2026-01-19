# Edge Function: send-contact-email

Esta função processa o envio de emails quando uma mensagem é enviada através do formulário de contato do site.

## Configuração

### Opção 1: Usar Resend (Recomendado)

1. Crie uma conta no [Resend](https://resend.com)
2. Obtenha sua API Key
3. Adicione a variável de ambiente no Supabase:
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
4. Descomente o código da Opção 1 no arquivo `index.ts`

### Opção 2: Usar SendGrid

1. Crie uma conta no [SendGrid](https://sendgrid.com)
2. Obtenha sua API Key
3. Adicione a variável de ambiente no Supabase:
   ```bash
   supabase secrets set SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```
4. Implemente a integração com SendGrid no código

### Opção 3: Usar serviço de email próprio

Configure seu próprio servidor SMTP e implemente a lógica de envio.

## Deploy

```bash
supabase functions deploy send-contact-email
```

## Uso

A função é chamada automaticamente pelo componente `ContactSection` quando uma mensagem é enviada.

## Nota

Atualmente, a função retorna sucesso mesmo sem enviar email, pois a mensagem já é salva no banco de dados. Para habilitar o envio real de emails, configure um dos serviços acima.
