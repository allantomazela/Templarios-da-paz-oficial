-- Migration: Create Ágape Management System
-- Sistema de gestão de ágape para o Mestre de Banquete

-- Tabela de sessões de ágape
CREATE TABLE IF NOT EXISTS public.agape_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'finalized')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_session_date UNIQUE(date)
);

-- Tabela de itens do cardápio
CREATE TABLE IF NOT EXISTS public.agape_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  category TEXT DEFAULT 'geral',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de consumos (o que cada irmão consumiu)
CREATE TABLE IF NOT EXISTS public.agape_consumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.agape_sessions(id) ON DELETE CASCADE,
  brother_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.agape_menu_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Evitar duplicatas: um irmão não pode consumir o mesmo item duas vezes na mesma sessão
  CONSTRAINT unique_brother_item_session UNIQUE(brother_id, menu_item_id, session_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agape_sessions_date ON public.agape_sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_agape_sessions_status ON public.agape_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agape_menu_items_active ON public.agape_menu_items(is_active);
CREATE INDEX IF NOT EXISTS idx_agape_consumptions_session ON public.agape_consumptions(session_id);
CREATE INDEX IF NOT EXISTS idx_agape_consumptions_brother ON public.agape_consumptions(brother_id);
CREATE INDEX IF NOT EXISTS idx_agape_consumptions_menu_item ON public.agape_consumptions(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_agape_consumptions_brother_session ON public.agape_consumptions(brother_id, session_id);

-- RLS Policies
ALTER TABLE public.agape_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agape_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agape_consumptions ENABLE ROW LEVEL SECURITY;

-- Políticas para agape_sessions
CREATE POLICY "Anyone can view agape sessions"
  ON public.agape_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mestre de Banquete can manage sessions"
  ON public.agape_sessions FOR ALL
  TO authenticated
  USING (
    public.has_module_permission(auth.uid(), 'agape') OR
    public.is_admin()
  );

-- Políticas para agape_menu_items
CREATE POLICY "Anyone can view active menu items"
  ON public.agape_menu_items FOR SELECT
  TO authenticated
  USING (is_active = true OR public.has_module_permission(auth.uid(), 'agape') OR public.is_admin());

CREATE POLICY "Mestre de Banquete can manage menu"
  ON public.agape_menu_items FOR ALL
  TO authenticated
  USING (
    public.has_module_permission(auth.uid(), 'agape') OR
    public.is_admin()
  );

-- Políticas para agape_consumptions
CREATE POLICY "Brothers can view own consumptions"
  ON public.agape_consumptions FOR SELECT
  TO authenticated
  USING (brother_id = auth.uid());

CREATE POLICY "Anyone can view open session consumptions"
  ON public.agape_consumptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agape_sessions
      WHERE id = session_id AND status = 'open'
    )
  );

CREATE POLICY "Mestre de Banquete can view all consumptions"
  ON public.agape_consumptions FOR SELECT
  TO authenticated
  USING (
    public.has_module_permission(auth.uid(), 'agape') OR
    public.is_admin()
  );

CREATE POLICY "Brothers can create own consumptions"
  ON public.agape_consumptions FOR INSERT
  TO authenticated
  WITH CHECK (
    brother_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.agape_sessions
      WHERE id = session_id AND status = 'open'
    )
  );

CREATE POLICY "Brothers can update own consumptions"
  ON public.agape_consumptions FOR UPDATE
  TO authenticated
  USING (
    brother_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.agape_sessions
      WHERE id = session_id AND status = 'open'
    )
  );

CREATE POLICY "Mestre de Banquete can manage all consumptions"
  ON public.agape_consumptions FOR ALL
  TO authenticated
  USING (
    public.has_module_permission(auth.uid(), 'agape') OR
    public.is_admin()
  );

-- Função para calcular total de consumo por irmão em uma sessão
CREATE OR REPLACE FUNCTION public.get_brother_session_total(
  p_brother_id UUID,
  p_session_id UUID
)
RETURNS TABLE (
  total_items INTEGER,
  total_amount NUMERIC(10, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_items,
    COALESCE(SUM(total_amount), 0)::NUMERIC(10, 2) as total_amount
  FROM public.agape_consumptions
  WHERE brother_id = p_brother_id
    AND session_id = p_session_id;
END;
$$;

-- Função para calcular total de uma sessão
CREATE OR REPLACE FUNCTION public.get_session_total(
  p_session_id UUID
)
RETURNS TABLE (
  total_brothers INTEGER,
  total_items INTEGER,
  total_amount NUMERIC(10, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT brother_id)::INTEGER as total_brothers,
    COUNT(*)::INTEGER as total_items,
    COALESCE(SUM(total_amount), 0)::NUMERIC(10, 2) as total_amount
  FROM public.agape_consumptions
  WHERE session_id = p_session_id;
END;
$$;

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_agape_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_agape_sessions_updated_at
  BEFORE UPDATE ON public.agape_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agape_updated_at();

CREATE TRIGGER update_agape_menu_items_updated_at
  BEFORE UPDATE ON public.agape_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agape_updated_at();

CREATE TRIGGER update_agape_consumptions_updated_at
  BEFORE UPDATE ON public.agape_consumptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agape_updated_at();

-- Trigger para calcular total_amount automaticamente
CREATE OR REPLACE FUNCTION public.calculate_consumption_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.total_amount = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_consumption_total_trigger
  BEFORE INSERT OR UPDATE ON public.agape_consumptions
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_consumption_total();
