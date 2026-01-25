-- Migration: Add Mestre de Banquete position
-- Adiciona o cargo 'mestre_banquete' ao enum e atualiza as permissões

-- Adicionar 'mestre_banquete' ao enum
ALTER TYPE public.lodge_position_type ADD VALUE IF NOT EXISTS 'mestre_banquete';

-- Atualizar função de permissões para incluir mestre_banquete
CREATE OR REPLACE FUNCTION public.has_module_permission(
  p_user_id UUID,
  p_module TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_position public.lodge_position_type;
BEGIN
  -- Master admin sempre tem acesso
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND email = 'allantomazela@gmail.com'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Obter cargo atual
  v_position := public.get_user_current_position(p_user_id);
  
  IF v_position IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Venerável Mestre tem acesso total
  IF v_position = 'veneravel_mestre' THEN
    RETURN TRUE;
  END IF;

  -- Verificar permissões específicas por cargo
  CASE v_position
    WHEN 'secretario' THEN
      RETURN p_module IN ('secretariat', 'agenda', 'library');
    WHEN 'chanceler' THEN
      RETURN p_module IN ('chancellor', 'agenda');
    WHEN 'tesoureiro' THEN
      RETURN p_module IN ('financial');
    WHEN 'orador' THEN
      RETURN p_module IN ('reports');
    WHEN 'mestre_banquete' THEN
      -- Mestre de Banquete pode gerenciar eventos e banquetes
      RETURN p_module IN ('agenda', 'events', 'agape');
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;
