-- Vincula cadastro da secretaria (brothers) à conta do sistema (profiles)

ALTER TABLE public.brothers
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_brothers_profile_id ON public.brothers(profile_id);

-- Preencher vínculos existentes pelo e-mail (contas aprovadas)
UPDATE public.brothers b
SET profile_id = p.id
FROM public.profiles p
WHERE b.profile_id IS NULL
  AND b.email IS NOT NULL
  AND trim(b.email) <> ''
  AND lower(trim(b.email)) = lower(trim(p.email))
  AND p.status = 'approved';

COMMENT ON COLUMN public.brothers.profile_id IS 'Conta de usuário (profiles) para mensalidades e acesso ao sistema';
