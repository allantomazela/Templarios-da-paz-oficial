# Hook Auth: auth-send-email (recuperação de senha)

## 1. Deploy

```bash
supabase functions deploy auth-send-email --project-ref hxncevpbwcearzxrstzj --no-verify-jwt
```

## 2. Secrets

```bash
supabase secrets set RESEND_API_KEY=re_xxxx --project-ref hxncevpbwcearzxrstzj
supabase secrets set EMAIL_FROM="Templários da Paz <noreply@templariosdapazoficial.com.br>" --project-ref hxncevpbwcearzxrstzj
```

## 3. Ativar no painel Supabase

1. **Authentication** → **Hooks** → **Send Email**
2. Habilitar o hook e informar a URL:

   `https://hxncevpbwcearzxrstzj.supabase.co/functions/v1/auth-send-email`

3. Copiar o **Hook secret** gerado e salvar:

   ```bash
   supabase secrets set SEND_EMAIL_HOOK_SECRET="v1,whsec_..." --project-ref hxncevpbwcearzxrstzj
   ```

4. **Authentication** → **URL Configuration** → adicionar redirect:

   - `https://templariosdapazoficial.com.br/reset-password`
   - `http://localhost:5173/reset-password` (dev)

## 4. Confirmar e-mail no cadastro

Recomendado: **desabilitar** confirmação automática de e-mail no signup (o acesso é liberado na **aprovação** + trigger `confirm_email_on_approval`).
