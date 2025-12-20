import { MinutesList } from '@/components/minutes/MinutesList'

export default function Minutes() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Atas e Balaústres</h2>
        <p className="text-muted-foreground">
          Gerenciamento e assinatura digital de atas das sessões.
        </p>
      </div>
      <MinutesList />
    </div>
  )
}
