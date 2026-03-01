# Aplicar migration: Indicações (candidatos à iniciação)

Esta migration cria as tabelas e políticas para o submódulo **Indicações** na Secretaria.

## Opção 1: Pelo Supabase Dashboard (recomendado)

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard) e abra seu projeto.
2. No menu lateral, vá em **SQL Editor**.
3. Clique em **New query**.
4. Copie todo o conteúdo do arquivo:
   ```
   supabase/migrations/20260205000000_create_initiation_candidates.sql
   ```
5. Cole no editor e clique em **Run** (ou Ctrl+Enter).
6. Se aparecer "Success" ou a execução terminar sem erro, a migration foi aplicada.

## Opção 2: Pelo Supabase CLI

Se preferir usar o CLI e já tiver o projeto vinculado:

```bash
npx supabase db push
```

Se ainda não vinculou o projeto:

```bash
npx supabase link
```

Informe o **Project ref** (encontrado em Settings → General no Dashboard) e a **senha do banco** (Database password). Depois execute:

```bash
npx supabase db push
```

## O que a migration faz

- Cria as tabelas: `sindicancia_phase_definitions`, `initiation_candidates`, `candidate_phase_progress`
- Habilita RLS e políticas para admin/editor (Secretaria)
- Insere as 5 fases padrão da sindicância (Documentação, Entrevistas, Visita à Loja, Parecer da Comissão, Votação)

Após aplicar, a aba **Indicações** na Secretaria passará a funcionar normalmente.
