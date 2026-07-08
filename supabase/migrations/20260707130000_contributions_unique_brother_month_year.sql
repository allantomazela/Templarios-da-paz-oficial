-- Garante unicidade de mensalidade por (irmão, mês, ano) e remove duplicidades.
--
-- Contexto: a tabela contributions foi criada em produção antes da constraint
-- UNIQUE(brother_id, month, year) existir na migração original. Como aquela
-- migração usa CREATE TABLE IF NOT EXISTS, a constraint nunca foi aplicada no
-- banco já existente. Isso permitiu que o botão "Lançar para este irmão"
-- criasse uma segunda linha para um mês que já tinha mensalidade pendente,
-- gerando duplicidade (uma "a vencer" + uma "paga").
--
-- Esta migração é SEGURA:
--   1) Remove apenas duplicatas de baixo risco (pendentes/atrasadas SEM vínculo
--      com a tesouraria), preservando sempre a melhor linha do período.
--   2) Se ainda restarem duplicatas de risco (ex.: duas linhas pagas/vinculadas
--      no mesmo período), ABORTA com mensagem clara para revisão manual — sem
--      apagar receita real.
--   3) Cria a constraint única apenas se ela ainda não existir (idempotente).
--
-- Auditoria manual (rodar antes, apenas leitura, se desejar inspecionar):
--   select brother_id, year, month, count(*) as qtd
--   from public.contributions
--   group by brother_id, year, month
--   having count(*) > 1
--   order by year desc, month desc;

-- 1) Remove duplicatas seguras, mantendo a melhor linha por período.
--    Prioridade da linha mantida: vinculada à tesouraria > paga > mais recente.
WITH ranked AS (
  SELECT
    id,
    transaction_id,
    status,
    ROW_NUMBER() OVER (
      PARTITION BY brother_id, month, year
      ORDER BY
        (transaction_id IS NOT NULL) DESC,
        (status = 'Pago') DESC,
        updated_at DESC,
        created_at DESC
    ) AS rn
  FROM public.contributions
)
DELETE FROM public.contributions AS c
USING ranked AS r
WHERE c.id = r.id
  AND r.rn > 1
  AND c.transaction_id IS NULL
  AND c.status <> 'Pago';

-- 2) e 3) Verificação de segurança + criação idempotente da constraint.
DO $$
DECLARE
  remaining_dups INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO remaining_dups
  FROM (
    SELECT brother_id, month, year
    FROM public.contributions
    GROUP BY brother_id, month, year
    HAVING COUNT(*) > 1
  ) d;

  IF remaining_dups > 0 THEN
    RAISE EXCEPTION
      'Ainda existem % período(s) com mensalidades duplicadas envolvendo linhas pagas/vinculadas à tesouraria. Revise manualmente (consolide para uma única linha) antes de reaplicar esta migração. Nenhuma receita foi apagada.',
      remaining_dups;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.contributions'::regclass
      AND contype = 'u'
      AND conname = 'contributions_brother_month_year_unique'
  ) THEN
    ALTER TABLE public.contributions
      ADD CONSTRAINT contributions_brother_month_year_unique
      UNIQUE (brother_id, month, year);
  END IF;
END $$;
