# admin-manage-credentials

Permite que **administradores** (role `admin` ou master) alterem senha ou e-mail de outro usuário, exigindo a senha do próprio admin.

## Status em produção

Função publicada no projeto `hxncevpbwcearzxrstzj` (**Templários Oficial**):

- **URL:** `https://hxncevpbwcearzxrstzj.supabase.co/functions/v1/admin-manage-credentials`
- **Verify JWT (gateway):** desabilitado — a função valida via `requireAdmin()`
- **Método:** `POST`
- **Arquivos:** `index.ts` + `_shared/auth.ts`, `_shared/cors.ts`, `_shared/admin-credentials.ts`
- **Migration:** `profiles_must_change_password` aplicada (coluna + RPC `clear_own_must_change_password`)

## Republicar

```bash
npx supabase functions deploy admin-manage-credentials --remote=hxncevpbwcearzxrstzj --no-verify-jwt --yes
```

## Corpos

### Alterar senha

```json
{
  "action": "set_password",
  "userId": "<uuid>",
  "adminPassword": "<senha-do-admin-logado>",
  "newPassword": "<nova-senha>",
  "forcePasswordChange": true
}
```

### Alterar e-mail (conta com e-mail desativado)

```json
{
  "action": "change_email",
  "userId": "<uuid>",
  "adminPassword": "<senha-do-admin-logado>",
  "newEmail": "novo@email.com"
}
```

Atualiza `auth.users`, `profiles.email` e `brothers` vinculados.
