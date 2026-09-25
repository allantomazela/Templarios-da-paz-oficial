-- Normaliza encapsulamentos duplos de auth.*() para um único (SELECT auth.*()).

CREATE OR REPLACE FUNCTION public.__normalize_auth_initplan_expr(p_expr text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v text := coalesce(p_expr, '');
  v_new text;
BEGIN
  IF v = '' THEN
    RETURN NULL;
  END IF;

  LOOP
    v_new := regexp_replace(
      v,
      '\(\s*SELECT\s+\(\s*SELECT\s+auth\.(uid|role|jwt)\(\)(\s+AS\s+\w+)?\s*\)(\s+AS\s+\w+)?\s*\)',
      '(SELECT auth.\1())',
      'gi'
    );
    EXIT WHEN v_new = v;
    v := v_new;
  END LOOP;

  v := regexp_replace(
    v,
    '\(\s*SELECT\s+auth\.(uid|role|jwt)\(\)(\s+AS\s+\w+)?\s*\)',
    '(SELECT auth.\1())',
    'gi'
  );

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
    v_using_new := public.__normalize_auth_initplan_expr(v_using);
    v_check_new := public.__normalize_auth_initplan_expr(v_check);

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

    v_roles := COALESCE(NULLIF(r.roles, ''), 'PUBLIC');

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
      v_sql := v_sql || format(' USING (%s)', coalesce(v_using_new, 'true'));
      v_sql := v_sql || format(
        ' WITH CHECK (%s)',
        coalesce(v_check_new, v_using_new, 'true')
      );
    END IF;

    EXECUTE v_sql;
    v_changed := v_changed + 1;
  END LOOP;

  RAISE NOTICE 'RLS auth initplan normalize: % policies updated', v_changed;
END;
$$;

DROP FUNCTION IF EXISTS public.__normalize_auth_initplan_expr(text);
