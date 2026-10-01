import { sendViaResend } from '../_shared/resend-mail.ts'
import { membershipOverdueReminderEmail } from '../_shared/user-email-templates.ts'
import { todayBrazilISODate, type AdminClient } from './reminder-context.ts'
import type { ReminderRecipient } from './reminder-selection.ts'

export interface DeliverySummary {
  sent: number
  skippedCount: number
  failed: number
}

async function deliverOne(
  admin: AdminClient,
  recipient: ReminderRecipient & { email: string },
): Promise<boolean> {
  const mail = membershipOverdueReminderEmail(
    recipient.brotherName,
    recipient.overdueLabels,
    recipient.overdueAmount,
    recipient.overdueCount,
  )

  const result = await sendViaResend({
    to: recipient.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  })
  if (!result.ok) return false

  const { error } = await admin.from('reminder_logs').insert({
    brother_id: recipient.brotherId,
    contribution_id: null,
    sent_date: todayBrazilISODate(),
    method: 'Email',
  })
  return !error
}

/** No máximo um lembrete por irmão por mês (cron e manual). */
export async function deliverReminders(
  admin: AdminClient,
  recipients: ReminderRecipient[],
): Promise<DeliverySummary> {
  const summary: DeliverySummary = { sent: 0, skippedCount: 0, failed: 0 }

  for (const recipient of recipients) {
    if (recipient.alreadyRemindedThisMonth) {
      summary.skippedCount++
      continue
    }
    if (!recipient.email) {
      summary.failed++
      continue
    }

    const ok = await deliverOne(admin, { ...recipient, email: recipient.email })
    if (ok) summary.sent++
    else summary.failed++
  }

  return summary
}

export function summarizeDelivery(
  alertsCount: number,
  summary: DeliverySummary,
): string {
  if (alertsCount === 0) return 'Nenhum irmão elegível para lembrete hoje.'

  const parts = [`${summary.sent} lembrete(s) enviado(s) por e-mail.`]
  if (summary.skippedCount > 0) {
    parts.push(`${summary.skippedCount} ignorado(s) (já enviado neste mês).`)
  }
  if (summary.failed > 0) parts.push(`${summary.failed} falha(s).`)
  return parts.join(' ')
}
