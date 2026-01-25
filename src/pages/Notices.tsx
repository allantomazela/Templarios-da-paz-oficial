import { NoticesList } from '@/components/secretariat/NoticesList'

export default function Notices() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mural de Avisos</h2>
        <p className="text-muted-foreground">
          Avisos e comunicados oficiais da loja.
        </p>
      </div>
      <NoticesList />
    </div>
  )
}
