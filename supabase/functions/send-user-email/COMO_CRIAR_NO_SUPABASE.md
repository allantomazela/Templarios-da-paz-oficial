# Edge Function: send-user-email

Envia e-mails transacionais de cadastro (aguardando aprovação) e de conta aprovada via Resend.

## Deploy (CLI ou MCP)

```bash
supabase functions deploy send-user-email --project-ref hxncevpbwcearzxrstzj
```

## Secrets obrigatórios

```bash
supabase secrets set RESEND_API_KEY=re_xxxx --project-ref hxncevpbwcearzxrstzj
supabase secrets set EMAIL_FROM="Templários da Paz <noreply@templariosdapazoficial.com.br>" --project-ref hxncevpbwcearzxrstzj
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são injetados automaticamente pelo Supabase.

## Tipos de e-mail

| type | Quem dispara |
|------|----------------|
| `signup_pending` | Após cadastro (app) |
| `account_approved` | Admin/diretoria ao aprovar usuário |
