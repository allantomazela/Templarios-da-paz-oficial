# Edge Function: run-payables-reminders

Envia e-mails de lembrete para admin/editores sobre **contas a pagar** (boletos e compromissos) dentro da janela configurada em Financeiro → Configurações.

Também é disparada automaticamente pelo **pg_cron** (migration `20260703120000_financial_payables.sql`), diariamente às 12:30 UTC.

## Sintoma se não estiver publicada

No navegador (Console), ao clicar em **Executar agora** em lembretes de contas a pagar:

```
Access to fetch at '.../functions/v1/run-payables-reminders' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check
```

Isso ocorre quando a função **não existe** no projeto Supabase (404 no OPTIONS, sem cabeçalhos CORS).

## Deploy (obrigatório em produção)

```bash
npx supabase functions deploy run-payables-reminders --project-ref hxncevpbwcearzxrstzj
```

A autenticação é feita **dentro** da função (`requireAdminOrEditor`). Não use `--no-verify-jwt` para chamadas manuais do painel (o JWT do usuário é validado).

Para o **cron via pg_net**, o banco envia `Authorization: Bearer <service_role_key>` — também suportado.

## Secrets obrigatórios (e-mail)

```bash
npx supabase secrets set RESEND_API_KEY=re_xxxx --project-ref hxncevpbwcearzxrstzj
npx supabase secrets set EMAIL_FROM="Templários da Paz <noreply@templariosdapazoficial.com.br>" --project-ref hxncevpbwcearzxrstzj
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são injetados automaticamente.

## Migration de banco

Antes de usar lembretes, aplique no SQL Editor (se ainda não aplicou):

- `supabase/migrations/20260703120000_financial_payables.sql`
- ou o consolidado `supabase/migrations/APLICAR_FINANCIAL_PAYABLES.sql`

Validação: `supabase/migrations/VALIDAR_FINANCIAL_PAYABLES.sql`

## Testar CORS (após deploy)

```bash
curl.exe -X OPTIONS "https://hxncevpbwcearzxrstzj.supabase.co/functions/v1/run-payables-reminders" ^
  -H "Origin: https://templariosdapazoficial.com.br" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: authorization,content-type,apikey" -D -
```

Esperado: **HTTP 204** com `Access-Control-Allow-Origin: https://templariosdapazoficial.com.br`.

## Aviso no console: "listener indicated an asynchronous response"

Mensagens como:

```
Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true,
but the message channel closed before a response was received
```

**Não são do sistema Templários.** Costumam vir de **extensões do Chrome** (tradutor, adblock, gerenciador de senhas). Teste em aba anônima sem extensões para confirmar.

## Ponto de restauração

Antes de alterações nesta área:

- Tag: `restore-point-2026-07-06-pre-payables-cors`
- Branch: `restore/pre-payables-cors-fix-2026-07-06`
