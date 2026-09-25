-- Padroniza TODAS as políticas RLS de public.* para usar (SELECT auth.uid()/role()/jwt())
-- Evita reavaliação por linha (auth_rls_initplan).

CREATE OR REPLACE FUNCTION public.__rewrite_auth_initplan_expr(p_expr text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v text := coalesce(p_expr, '');
BEGIN
  IF v = '' THEN
    RETURN NULL;
  END IF;

  -- Protege formas já encapsuladas (com ou sem alias)
  v := regexp_replace(
    v,
    '\(SELECT auth\.(uid|role|jwt)\(\)( AS [^)]+)?\)',
    '___KEEP_\1___',
    'gi'
  );

  v := regexp_replace(v, '\yauth\.uid\(\)', '(SELECT auth.uid())', 'g');
  v := regexp_replace(v, '\yauth\.role\(\)', '(SELECT auth.role())', 'g');
  v := regexp_replace(v, '\yauth\.jwt\(\)', '(SELECT auth.jwt())', 'g');

  v := replace(v, '___KEEP_uid___', '(SELECT auth.uid())');
  v := replace(v, '___KEEP_role___', '(SELECT auth.role())');
  v := replace(v, '___KEEP_jwt___', '(SELECT auth.jwt())');
  v := replace(v, '___KEEP_UID___', '(SELECT auth.uid())');
  v := replace(v, '___KEEP_ROLE___', '(SELECT auth.role())');
  v := replace(v, '___KEEP_JWT___', '(SELECT auth.jwt())');

  RETURN v;
END;
$$;

DO $$
DECLARE
  r record;
  v_using text;
  v_check text;
  v_using_new text;
  v_check_new text;
  v_cmd text;
  v_roles text;
  v_sql text;
  v_changed int := 0;
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schema_name,
      c.relname AS table_name,
      p.polname AS policy_name,
      p.polcmd AS cmd,
      p.polpermissive AS permissive,
      pg_get_expr(p.polqual, p.polrelid) AS using_expr,
      pg_get_expr(p.polwithcheck, p.polrelid) AS with_check,
      CASE
        WHEN coalesce(cardinality(p.polroles), 0) = 0 THEN 'PUBLIC'
        ELSE array_to_string(
          ARRAY(
            SELECT quote_ident(rol.rolname)
            FROM pg_roles rol
            WHERE rol.oid = ANY (p.polroles)
            ORDER BY rol.rolname
          ),
          ', '
        )
      END AS roles
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    ORDER BY c.relname, p.polname
  LOOP
    v_using := r.using_expr;
    v_check := r.with_check;
    v_using_new := public.__rewrite_auth_initplan_expr(v_using);
    v_check_new := public.__rewrite_auth_initplan_expr(v_check);

    IF coalesce(v_using_new, '') IS NOT DISTINCT FROM coalesce(v_using, '')
       AND coalesce(v_check_new, '') IS NOT DISTINCT FROM coalesce(v_check, '') THEN
      CONTINUE;
    END IF;

    v_cmd := CASE r.cmd
      WHEN 'r' THEN 'SELECT'
      WHEN 'a' THEN 'INSERT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE'
      WHEN '*' THEN 'ALL'
      ELSE NULL
    END;

    IF v_cmd IS NULL THEN
      RAISE EXCEPTION 'Unsupported policy command % on %.%', r.cmd, r.table_name, r.policy_name;
    END IF;

    v_roles := NULLIF(r.roles, '');
    IF v_roles IS NULL THEN
      v_roles := 'PUBLIC';
    END IF;

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      r.policy_name,
      r.schema_name,
      r.table_name
    );

    v_sql := format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
      r.policy_name,
      r.schema_name,
      r.table_name,
      CASE WHEN r.permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      v_cmd,
      v_roles
    );

    IF v_cmd = 'INSERT' THEN
      v_sql := v_sql || format(' WITH CHECK (%s)', coalesce(v_check_new, v_using_new, 'true'));
    ELSIF v_cmd IN ('SELECT', 'DELETE') THEN
      v_sql := v_sql || format(' USING (%s)', coalesce(v_using_new, 'true'));
    ELSE
      -- UPDATE / ALL
      v_sql := v_sql || format(' USING (%s)', coalesce(v_using_new, 'true'));
      v_sql := v_sql || format(
        ' WITH CHECK (%s)',
        coalesce(v_check_new, v_using_new, 'true')
      );
    END IF;

    EXECUTE v_sql;
    v_changed := v_changed + 1;
  END LOOP;

  RAISE NOTICE 'RLS auth initplan rewrite: % policies updated', v_changed;
END;
$$;

DROP FUNCTION IF EXISTS public.__rewrite_auth_initplan_expr(text);
