-- Padroniza nomes de pessoas em Nome Próprio (ex.: "ALLAN TOMAZELA DE CAMARGO" → "Allan Tomazela de Camargo").
-- Conectivos (de, da, do, das, dos, e) ficam minúsculos, exceto como primeira palavra.
-- Um "é" isolado no meio do nome é tratado como o conectivo "e" (erro comum de digitação).

CREATE OR REPLACE FUNCTION public.format_person_name(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_name IS NULL THEN NULL
    ELSE COALESCE((
      SELECT string_agg(
        CASE
          WHEN w.ord > 1 AND w.word IN ('de', 'da', 'do', 'das', 'dos', 'e') THEN w.word
          WHEN w.ord > 1 AND w.word = 'é' THEN 'e'
          -- o espaço temporário após o apóstrofo faz o INITCAP gerar D'Ávila em vez de D'ávila
          ELSE replace(initcap(replace(w.word, '''', ''' ')), ''' ', '''')
        END,
        ' ' ORDER BY w.ord
      )
      FROM unnest(string_to_array(lower(btrim(regexp_replace(p_name, '[\s\u00A0]+', ' ', 'g'))), ' '))
           WITH ORDINALITY AS w(word, ord)
      WHERE w.word <> ''
    ), '')
  END
$$;

COMMENT ON FUNCTION public.format_person_name(text) IS
  'Formata nome de pessoa em Nome Próprio, mantendo conectivos (de, da, do, das, dos, e) em minúsculo.';

-- Gatilho único para todas as tabelas com nome de pessoa; cada tabela informa suas colunas.
CREATE OR REPLACE FUNCTION public.normalize_person_name_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'profiles' THEN
      NEW.full_name := public.format_person_name(NEW.full_name);
    WHEN 'brothers' THEN
      NEW.name := public.format_person_name(NEW.name);
      NEW.spouse_name := public.format_person_name(NEW.spouse_name);
    ELSE
      NEW.name := public.format_person_name(NEW.name);
  END CASE;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_person_name ON public.profiles;
CREATE TRIGGER normalize_person_name
  BEFORE INSERT OR UPDATE OF full_name ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_person_name_columns();

DROP TRIGGER IF EXISTS normalize_person_name ON public.brothers;
CREATE TRIGGER normalize_person_name
  BEFORE INSERT OR UPDATE OF name, spouse_name ON public.brothers
  FOR EACH ROW EXECUTE FUNCTION public.normalize_person_name_columns();

DROP TRIGGER IF EXISTS normalize_person_name ON public.visitor_attendances;
CREATE TRIGGER normalize_person_name
  BEFORE INSERT OR UPDATE OF name ON public.visitor_attendances
  FOR EACH ROW EXECUTE FUNCTION public.normalize_person_name_columns();

DROP TRIGGER IF EXISTS normalize_person_name ON public.initiation_candidates;
CREATE TRIGGER normalize_person_name
  BEFORE INSERT OR UPDATE OF name ON public.initiation_candidates
  FOR EACH ROW EXECUTE FUNCTION public.normalize_person_name_columns();

DROP TRIGGER IF EXISTS normalize_person_name ON public.venerables;
CREATE TRIGGER normalize_person_name
  BEFORE INSERT OR UPDATE OF name ON public.venerables
  FOR EACH ROW EXECUTE FUNCTION public.normalize_person_name_columns();

-- Padronização dos dados existentes (somente linhas que mudam).
UPDATE public.profiles SET full_name = public.format_person_name(full_name)
 WHERE full_name IS DISTINCT FROM public.format_person_name(full_name);

UPDATE public.brothers
   SET name = public.format_person_name(name),
       spouse_name = public.format_person_name(spouse_name)
 WHERE name IS DISTINCT FROM public.format_person_name(name)
    OR spouse_name IS DISTINCT FROM public.format_person_name(spouse_name);

UPDATE public.visitor_attendances SET name = public.format_person_name(name)
 WHERE name IS DISTINCT FROM public.format_person_name(name);

UPDATE public.initiation_candidates SET name = public.format_person_name(name)
 WHERE name IS DISTINCT FROM public.format_person_name(name);

UPDATE public.venerables SET name = public.format_person_name(name)
 WHERE name IS DISTINCT FROM public.format_person_name(name);

-- Grafia confirmada pela Loja: "Melo" (igual à ficha do irmão).
UPDATE public.venerables SET name = 'Oswaldo Melo da Rocha'
 WHERE name = 'Oswaldo Mello da Rocha';
