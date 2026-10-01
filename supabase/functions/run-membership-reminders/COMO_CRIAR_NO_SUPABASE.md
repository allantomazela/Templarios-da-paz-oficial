# Edge Function: run-membership-reminders

Envia e-mails de lembrete de **mensalidades em atraso** para os irmãos, conforme configuração em Financeiro → Configurações → Lembretes de mensalidade.

Também é disparada automaticamente pelo **pg_cron** (migration `20260618120000_membership_reminder_automation.sql`), diariamente às **12:00 UTC (9h BRT)**.

## Modos de execução

| Chamada | Quem | Regra |
| --- | --- | --- |
| Automática (pg_cron, service role) | Banco | Só envia se `membership_reminder_enabled = true` (padrão: desligado); respeita momento/dias configurados |
| Manual (`{}`) | Somente administrador | Envia para todos com mensalidade em atraso, mesmo com o automático desligado |
| Prévia (`{ "dryRun": true }`) | Somente administrador | Retorna a lista de destinatários, sem enviar nem registrar execução |

Em todos os modos, cada irmão recebe no máximo um lembrete por mês. Apenas administradores podem alterar `membership_reminder_*` (trigger `guard_membership_reminder_settings`).

## Sintoma se não estiver publicada

No navegador (Console), ao clicar em **Enviar lembretes agora** nos lembretes de mensalidade:

```
Access to fetch at '.../functions/v1/run-membership-reminders' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check
```

Isso ocorre quando a função **não existe** no projeto Supabase (404 no OPTIONS, sem cabeçalhos CORS).

## Deploy (obrigatório em produção)

Preferencialmente pelo GitHub: **Actions → Publicar Edge Function (manual) → Run workflow** (requer o segredo `SUPABASE_ACCESS_TOKEN`). Ou pela CLI:

```bash
npx supabase functions deploy run-membership-reminders --project-ref hxncevpbwcearzxrstzj --no-verify-jwt
```

A autenticação é feita **dentro** da função (`requireAdmin` para chamadas do painel), por isso `verify_jwt` fica desligado em produção.

Para o **cron via pg_net**, o banco envia `Authorization: Bearer <service_role_key>` — também suportado.

## Secrets obrigatórios (e-mail)

```bash
npx supabase secrets set RESEND_API_KEY=re_xxxx --project-ref hxncevpbwcearzxrstzj
npx supabase secrets set EMAIL_FROM="Templários da Paz <noreply@templariosdapazoficial.com.br>" --project-ref hxncevpbwcearzxrstzj
```

## Secret no Vault (disparo automático pelo banco)

O job `membership-reminder-daily` precisa do secret `service_role_key` no Vault:

```sql
SELECT vault.create_secret(
  '<SUPABASE_SERVICE_ROLE_KEY>',
  'service_role_key',
  'Chave para edge functions internas (pg_net)'
);
```

Sem esse secret, a execução manual pelo painel ainda funciona; o **cron automático** não dispara.

## Testar CORS (após deploy)

```bash
curl.exe -X OPTIONS "https://hxncevpbwcearzxrstzj.supabase.co/functions/v1/run-membership-reminders" ^
  -H "Origin: https://templariosdapazoficial.com.br" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: authorization,content-type,apikey" -D -
```

Esperado: **HTTP 204** com `Access-Control-Allow-Origin: https://templariosdapazoficial.com.br`.

## Função relacionada

- Contas a pagar: `supabase/functions/run-payables-reminders/COMO_CRIAR_NO_SUPABASE.md`

## Aviso no console: extensões do Chrome

Mensagens como *"A listener indicated an asynchronous response..."* **não são do sistema** — costumam vir de extensões do navegador. Teste em aba anônima para confirmar.
