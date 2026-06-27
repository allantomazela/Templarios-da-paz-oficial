import { supabase } from '@/lib/supabase/client'
import { toErrorMessage } from '@/lib/async-utils'
import type { AccountReconciliationAudit } from '@/lib/account-reconciliation'
import {
  buildAlertCompositeKey,
  buildAlertFingerprint,
  filterAcknowledgedAudit,
  type ReconciliationAlertAcknowledgment,
  type ReconciliationAlertType,
} from '@/lib/account-reconciliation'

export type {
  ReconciliationAlertAcknowledgment,
  ReconciliationAlertType,
}

export { buildAlertFingerprint, buildAlertCompositeKey }

export async function fetchReconciliationAlertAcknowledgments(): Promise<
  ReconciliationAlertAcknowledgment[]
> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('financial_reconciliation_alert_acknowledgments')
    .select(
      'alert_type, alert_key, transaction_fingerprint, note, acknowledged_at, acknowledged_by',
    )
    .order('acknowledged_at', { ascending: false })

  if (error) {
    throw new Error(toErrorMessage(error, 'Falha ao carregar verificações de alertas.'))
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    alertType: String(row.alert_type) as ReconciliationAlertType,
    alertKey: String(row.alert_key),
    transactionFingerprint: String(row.transaction_fingerprint),
    note: row.note ? String(row.note) : null,
    acknowledgedAt: String(row.acknowledged_at),
    acknowledgedBy: row.acknowledged_by ? String(row.acknowledged_by) : null,
  }))
}

export function buildAcknowledgmentKeySet(
  acknowledgments: ReconciliationAlertAcknowledgment[],
): Set<string> {
  return new Set(
    acknowledgments.map((item) =>
      buildAlertCompositeKey(
        item.alertType,
        item.alertKey,
        item.transactionFingerprint,
      ),
    ),
  )
}

export function applyAcknowledgmentsToAudit(
  audit: AccountReconciliationAudit,
  acknowledgments: ReconciliationAlertAcknowledgment[],
): AccountReconciliationAudit {
  return filterAcknowledgedAudit(audit, buildAcknowledgmentKeySet(acknowledgments))
}

export async function acknowledgeReconciliationAlert(input: {
  alertType: ReconciliationAlertType
  alertKey: string
  transactionIds: string[]
  note?: string
}): Promise<ReconciliationAlertAcknowledgment> {
  const transactionFingerprint = buildAlertFingerprint(input.transactionIds)
  if (!transactionFingerprint) {
    throw new Error('Nenhum lançamento informado para verificação.')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('financial_reconciliation_alert_acknowledgments')
    .upsert(
      {
        alert_type: input.alertType,
        alert_key: input.alertKey,
        transaction_fingerprint: transactionFingerprint,
        note: input.note?.trim() || null,
        acknowledged_by: user?.id ?? null,
        acknowledged_at: new Date().toISOString(),
      },
      { onConflict: 'alert_type,alert_key,transaction_fingerprint' },
    )
    .select(
      'alert_type, alert_key, transaction_fingerprint, note, acknowledged_at, acknowledged_by',
    )
    .single()

  if (error) {
    throw new Error(toErrorMessage(error, 'Falha ao registrar verificação do alerta.'))
  }

  return {
    alertType: String(data.alert_type) as ReconciliationAlertType,
    alertKey: String(data.alert_key),
    transactionFingerprint: String(data.transaction_fingerprint),
    note: data.note ? String(data.note) : null,
    acknowledgedAt: String(data.acknowledged_at),
    acknowledgedBy: data.acknowledged_by ? String(data.acknowledged_by) : null,
  }
}
