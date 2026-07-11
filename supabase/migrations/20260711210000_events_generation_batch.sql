-- Controle de geração automática de sessões: identificar e desfazer lotes
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_auto_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS generated_batch_id uuid;

CREATE INDEX IF NOT EXISTS idx_events_generated_batch_id
  ON events (generated_batch_id);

COMMENT ON COLUMN events.is_auto_generated IS 'Sessão criada pela geração automática da agenda';
COMMENT ON COLUMN events.generated_batch_id IS 'Agrupa sessões criadas na mesma geração em lote (permite desfazer)';

-- Backfill: marca as sessões já geradas automaticamente (descrição padrão)
-- agrupando-as em um único lote para permitir desfazer.
WITH batch AS (SELECT gen_random_uuid() AS id)
UPDATE events
SET is_auto_generated = true,
    generated_batch_id = (SELECT id FROM batch)
WHERE type = 'Sessão'
  AND generated_batch_id IS NULL
  AND description = 'Sessão programada conforme calendário padrão da loja.';
