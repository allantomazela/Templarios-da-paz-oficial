# Edge Function: send-user-email

Envia e-mails transacionais de cadastro (aguardando aprovação) e de conta aprovada via Resend.

## Deploy (CLI ou MCP)

```bash
supabase functions deploy send-user-email --project-ref hxncevpbwcearzxrstzj --no-verify-jwt
```

**Importante:** use `--no-verify-jwt` para permitir o disparo após o cadastro (sem sessão JWT) e via `pg_net` no banco.

## Secrets obrigatórios

```bash
supabase secrets set RESEND_API_KEY=re_xxxx --project-ref hxncevpbwcearzxrstzj
supabase secrets set EMAIL_FROM="Templários da Paz <noreply@templariosdapazoficial.com.br>" --project-ref hxncevpbwcearzxrstzj
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são injetados automaticamente pelo Supabase.

## Secret no Vault (disparo automático pelo banco)

A migration `20260611160000_user_lifecycle_emails.sql` envia e-mails via `pg_net` quando:

- um perfil **member** é criado com status `pending` → `signup_pending`
- um perfil passa para `approved` → `account_approved`

Configure no **SQL Editor** do Supabase (substitua pela service role real):

```sql
SELECT vault.create_secret(
  '<SUPABASE_SERVICE_ROLE_KEY>',
  'service_role_key',
  'Chave para edge functions internas (pg_net)'
);
```

Sem esse secret, o app ainda tenta enviar pelo frontend após o cadastro; a aprovação depende do admin ou do vault configurado.

## Tipos de e-mail

| type | Quem dispara |
|------|----------------|
| `signup_pending` | Trigger no banco + fallback no app após cadastro |
| `account_approved` | Trigger no banco ao aprovar + fallback no painel admin |

## Resend

Verifique no [Resend](https://resend.com/domains) se o domínio `templariosdapazoficial.com.br` está verificado e se `EMAIL_FROM` usa esse domínio.
