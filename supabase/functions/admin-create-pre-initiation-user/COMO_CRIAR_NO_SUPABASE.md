# admin-create-pre-initiation-user

Cria conta de **pré-iniciação** (admin): e-mail já confirmado, status `pre_iniciacao`, cadastro na secretaria fora do quadro.

## Status em produção

Função publicada no projeto `hxncevpbwcearzxrstzj`:

- **URL:** `https://hxncevpbwcearzxrstzj.supabase.co/functions/v1/admin-create-pre-initiation-user`
- **Verify JWT (gateway):** desabilitado — a função valida com `requireAdmin()`
- **Método:** `POST`

## Deploy

```bash
npx supabase functions deploy admin-create-pre-initiation-user --project-ref hxncevpbwcearzxrstzj --no-verify-jwt
```

## Body

```json
{
  "fullName": "Nome Completo",
  "email": "email@exemplo.com",
  "password": "senhaTemporaria8+",
  "phone": "14999999999"
}
```

`phone` é opcional.
