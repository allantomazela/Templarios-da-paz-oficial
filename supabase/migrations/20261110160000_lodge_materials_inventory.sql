-- Controle de materiais da loja (Chancelaria): catálogo + movimentações.
-- Não altera presença, graus, sólidos nem financeiro.

CREATE TABLE IF NOT EXISTS public.lodge_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'outro',
  unit text NOT NULL DEFAULT 'un',
  quantity_on_hand integer NOT NULL DEFAULT 0,
  minimum_quantity integer NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT lodge_materials_name_len CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  CONSTRAINT lodge_materials_category_ok CHECK (
    category IN ('ritual', 'pin', 'avental', 'luva', 'outro')
  ),
  CONSTRAINT lodge_materials_unit_len CHECK (char_length(trim(unit)) BETWEEN 1 AND 20),
  CONSTRAINT lodge_materials_qty_nonneg CHECK (quantity_on_hand >= 0),
  CONSTRAINT lodge_materials_min_nonneg CHECK (minimum_quantity >= 0),
  CONSTRAINT lodge_materials_notes_len CHECK (char_length(notes) <= 400)
);

CREATE UNIQUE INDEX IF NOT EXISTS lodge_materials_name_active_uidx
  ON public.lodge_materials (lower(trim(name)))
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS lodge_materials_category_idx
  ON public.lodge_materials (category, is_active);

CREATE TABLE IF NOT EXISTS public.lodge_material_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.lodge_materials(id) ON DELETE RESTRICT,
  movement_type text NOT NULL,
  quantity integer NOT NULL,
  quantity_before integer NOT NULL,
  quantity_after integer NOT NULL,
  brother_id uuid REFERENCES public.brothers(id) ON DELETE SET NULL,
  reason text NOT NULL DEFAULT '',
  moved_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT lodge_material_movements_type_ok CHECK (
    movement_type IN ('entrada', 'saida', 'ajuste')
  ),
  CONSTRAINT lodge_material_movements_qty_ok CHECK (
    (movement_type = 'ajuste' AND quantity >= 0)
    OR (movement_type IN ('entrada', 'saida') AND quantity > 0)
  ),
  CONSTRAINT lodge_material_movements_before_nonneg CHECK (quantity_before >= 0),
  CONSTRAINT lodge_material_movements_after_nonneg CHECK (quantity_after >= 0),
  CONSTRAINT lodge_material_movements_reason_len CHECK (char_length(reason) <= 400)
);

CREATE INDEX IF NOT EXISTS lodge_material_movements_material_moved_idx
  ON public.lodge_material_movements (material_id, moved_at DESC);

ALTER TABLE public.lodge_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lodge_material_movements ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.lodge_materials FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.lodge_material_movements FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lodge_materials TO authenticated;
GRANT SELECT ON TABLE public.lodge_material_movements TO authenticated;

DROP POLICY IF EXISTS "Chancellor can read lodge materials" ON public.lodge_materials;
CREATE POLICY "Chancellor can read lodge materials"
  ON public.lodge_materials FOR SELECT TO authenticated
  USING (public.can_manage_chancellor_data(auth.uid()));

DROP POLICY IF EXISTS "Chancellor can insert lodge materials" ON public.lodge_materials;
CREATE POLICY "Chancellor can insert lodge materials"
  ON public.lodge_materials FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_chancellor_data(auth.uid()));

DROP POLICY IF EXISTS "Chancellor can update lodge materials" ON public.lodge_materials;
CREATE POLICY "Chancellor can update lodge materials"
  ON public.lodge_materials FOR UPDATE TO authenticated
  USING (public.can_manage_chancellor_data(auth.uid()))
  WITH CHECK (public.can_manage_chancellor_data(auth.uid()));

DROP POLICY IF EXISTS "Chancellor can delete lodge materials" ON public.lodge_materials;
CREATE POLICY "Chancellor can delete lodge materials"
  ON public.lodge_materials FOR DELETE TO authenticated
  USING (public.can_manage_chancellor_data(auth.uid()));

DROP POLICY IF EXISTS "Chancellor can read lodge material movements" ON public.lodge_material_movements;
CREATE POLICY "Chancellor can read lodge material movements"
  ON public.lodge_material_movements FOR SELECT TO authenticated
  USING (public.can_manage_chancellor_data(auth.uid()));

-- Movimentações só via RPC (atualiza saldo de forma atômica).
CREATE OR REPLACE FUNCTION public.apply_lodge_material_movement(
  p_material_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_brother_id uuid DEFAULT NULL,
  p_reason text DEFAULT ''
)
RETURNS public.lodge_material_movements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_before integer;
  v_after integer;
  v_row public.lodge_material_movements;
BEGIN
  IF v_actor IS NULL OR NOT public.can_manage_chancellor_data(v_actor) THEN
    RAISE EXCEPTION 'Sem permissão para movimentar materiais.';
  END IF;

  IF p_movement_type NOT IN ('entrada', 'saida', 'ajuste') THEN
    RAISE EXCEPTION 'Tipo de movimento inválido.';
  END IF;

  IF p_movement_type = 'ajuste' THEN
    IF p_quantity IS NULL OR p_quantity < 0 THEN
      RAISE EXCEPTION 'Informe o novo saldo (zero ou mais).';
    END IF;
  ELSIF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Informe uma quantidade positiva.';
  END IF;

  SELECT quantity_on_hand
  INTO v_before
  FROM public.lodge_materials
  WHERE id = p_material_id AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Material não encontrado ou inativo.';
  END IF;

  IF p_movement_type = 'entrada' THEN
    v_after := v_before + p_quantity;
  ELSIF p_movement_type = 'saida' THEN
    IF p_quantity > v_before THEN
      RAISE EXCEPTION 'Estoque insuficiente para a saída.';
    END IF;
    v_after := v_before - p_quantity;
  ELSE
    -- ajuste: p_quantity é o novo saldo absoluto
    v_after := p_quantity;
  END IF;

  UPDATE public.lodge_materials
  SET
    quantity_on_hand = v_after,
    updated_at = timezone('utc', now())
  WHERE id = p_material_id;

  INSERT INTO public.lodge_material_movements (
    material_id,
    movement_type,
    quantity,
    quantity_before,
    quantity_after,
    brother_id,
    reason,
    created_by
  )
  VALUES (
    p_material_id,
    p_movement_type,
    p_quantity,
    v_before,
    v_after,
    p_brother_id,
    coalesce(trim(p_reason), ''),
    v_actor
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_lodge_material_movement(uuid, text, integer, uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_lodge_material_movement(uuid, text, integer, uuid, text)
  TO authenticated;

COMMENT ON TABLE public.lodge_materials IS
  'Catálogo de materiais da loja (rituais, pins, aventais, luvas etc.).';
COMMENT ON TABLE public.lodge_material_movements IS
  'Histórico de entradas, saídas e ajustes de estoque.';
COMMENT ON FUNCTION public.apply_lodge_material_movement(uuid, text, integer, uuid, text) IS
  'Registra movimento e atualiza o saldo do material de forma atômica.';

-- Seed inicial idempotente
INSERT INTO public.lodge_materials (name, category, unit, quantity_on_hand, minimum_quantity, notes)
SELECT v.name, v.category, 'un', 0, v.minimum_quantity, ''
FROM (
  VALUES
    ('Ritual Aprendiz', 'ritual', 2),
    ('Ritual Companheiro', 'ritual', 2),
    ('Ritual Mestre', 'ritual', 2),
    ('Pin da Loja', 'pin', 5),
    ('Avental Aprendiz', 'avental', 2),
    ('Avental Companheiro', 'avental', 2),
    ('Avental Mestre', 'avental', 2),
    ('Par de Luvas', 'luva', 5)
) AS v(name, category, minimum_quantity)
WHERE NOT EXISTS (SELECT 1 FROM public.lodge_materials LIMIT 1);
