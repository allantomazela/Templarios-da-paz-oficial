-- Data da próxima checagem por fase (timeline da sindicância)
ALTER TABLE public.candidate_phase_progress
  ADD COLUMN IF NOT EXISTS scheduled_check_date DATE;

COMMENT ON COLUMN public.candidate_phase_progress.scheduled_check_date IS 'Data prevista para a próxima verificação/checagem desta fase';
