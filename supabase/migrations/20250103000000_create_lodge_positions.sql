-- Migration: Create Lodge Positions System
-- Sistema de gestão de cargos maçônicos com permissões específicas

-- Enum para cargos maçônicos
DO $$ BEGIN
    CREATE TYPE public.lodge_position_type AS ENUM (
      'veneravel_mestre',
      'orador',
      'secretario',
      'chanceler',
      'tesoureiro'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela de cargos atuais (mandato de 2 anos)
CREATE TABLE IF NOT EXISTS public.lodge_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_type public.lodge_position_type NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT valid_period CHECK (end_date > start_date)
);

-- Tabela de histórico de cargos (para rastreamento de mudanças)
CREATE TABLE IF NOT EXISTS public.lodge_position_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_type public.lodge_position_type NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lodge_positions_user_id ON public.lodge_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_lodge_positions_type ON public.lodge_positions(position_type);
CREATE INDEX IF NOT EXISTS idx_lodge_positions_dates ON public.lodge_positions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_position_history_user_id ON public.lodge_position_history(user_id);
CREATE INDEX IF NOT EXISTS idx_position_history_type ON public.lodge_position_history(position_type);

-- RLS Policies
ALTER TABLE public.lodge_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lodge_position_history ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem ver cargos atuais
CREATE POLICY "Anyone can view current positions"
  ON public.lodge_positions FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins podem gerenciar cargos
CREATE POLICY "Admins can manage positions"
  ON public.lodge_positions FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Todos podem ver histórico (read-only)
CREATE POLICY "Anyone can view position history"
  ON public.lodge_position_history FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins podem inserir no histórico (via trigger ou manualmente)
CREATE POLICY "Admins can insert position history"
  ON public.lodge_position_history FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Função para verificar se usuário tem cargo ativo
CREATE OR REPLACE FUNCTION public.has_active_position(
  p_user_id UUID,
  p_position_type public.lodge_position_type
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.lodge_positions
    WHERE user_id = p_user_id
      AND position_type = p_position_type
      AND CURRENT_DATE BETWEEN start_date AND end_date
  );
END;
$$;

-- Função para obter cargo atual do usuário
CREATE OR REPLACE FUNCTION public.get_user_current_position(p_user_id UUID)
RETURNS public.lodge_position_type
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_position public.lodge_position_type;
BEGIN
  SELECT position_type INTO v_position
  FROM public.lodge_positions
  WHERE user_id = p_user_id
    AND CURRENT_DATE BETWEEN start_date AND end_date
  LIMIT 1;
  
  RETURN v_position;
END;
$$;

-- Função para verificar permissão de módulo baseado em cargo
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
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_lodge_positions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_lodge_positions_updated_at
  BEFORE UPDATE ON public.lodge_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lodge_positions_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.lodge_positions IS 'Cargos atuais da diretoria da loja (mandato de 2 anos)';
COMMENT ON TABLE public.lodge_position_history IS 'Histórico de todos os cargos ocupados';
COMMENT ON FUNCTION public.has_active_position IS 'Verifica se usuário tem cargo ativo do tipo especificado';
COMMENT ON FUNCTION public.get_user_current_position IS 'Retorna o cargo atual ativo do usuário';
COMMENT ON FUNCTION public.has_module_permission IS 'Verifica se usuário tem permissão para acessar um módulo específico baseado em seu cargo';

