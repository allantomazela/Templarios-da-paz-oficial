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

3. Copiar o **Hook secret** gerado e salvar **o mesmo valor** no secret da função:

   ```bash
   supabase secrets set SEND_EMAIL_HOOK_SECRET="v1,whsec_..." --project-ref hxncevpbwcearzxrstzj
   ```

   Se o painel tiver **“Require authorization token”** ligado, o Supabase envia `Authorization: Bearer <secret>` — a função `auth-send-email` (v3+) aceita isso. O valor do Bearer deve ser **idêntico** ao `SEND_EMAIL_HOOK_SECRET`.

4. **Authentication** → **URL Configuration** → adicionar redirect:

   - `https://templariosdapazoficial.com.br/reset-password`
   - `http://localhost:5173/reset-password` (dev)

## 4. Confirmar e-mail no cadastro

Recomendado: **desabilitar** confirmação automática de e-mail no signup (o acesso é liberado na **aprovação** + trigger `confirm_email_on_approval`).

## 5. Erros comuns (`/recover` 500)

| Sintoma nos logs Auth | Causa | O que fazer |
|------------------------|-------|-------------|
| `Hook requires authorization token` | Hook exige Bearer e secret não bate | Igualar secret do painel e `SEND_EMAIL_HOOK_SECRET` |
| `Unexpected status code returned from hook: 401` | Assinatura/token inválidos | Recopiar o Hook secret no painel e no `supabase secrets set` |
| `Unexpected status code returned from hook: 500` | Resend falhou (domínio/API) | No [Resend](https://resend.com/domains), verificar DNS de `templariosdapazoficial.com.br` e o remetente em `EMAIL_FROM` |
| Erro `listener indicated an asynchronous response` no Chrome | Extensão do navegador | Ignorar; não é do site |

**Limite:** o projeto pode estar com rate limit de **2 e-mails de auth por hora** — aguarde ou ajuste em **Authentication** → **Rate limits**.

**Deploy via MCP já aplicado:** função `auth-send-email` versão **3** (auth Bearer + assinatura webhook + Resend).
