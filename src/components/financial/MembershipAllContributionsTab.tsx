import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { Contribution } from '@/lib/data'
import { MembershipContributionsTable } from './MembershipContributionsTable'

function matchesSearch(
  contribution: Contribution,
  brotherNames: Record<string, string>,
  searchTerm: string,
): boolean {
  const q = searchTerm.toLowerCase()
  const name = (
    brotherNames[contribution.brotherId] || contribution.brotherName || ''
  ).toLowerCase()
  return (
    name.includes(q) ||
    contribution.month.toLowerCase().includes(q) ||
    String(contribution.year).includes(q) ||
    contribution.status.toLowerCase().includes(q)
  )
}

export function MembershipAllContributionsTab({
  contributions,
  brotherNames,
  searchTerm,
  onSearchTermChange,
  loading,
  onEdit,
  onDelete,
}: MembershipAllContributionsTabProps) {
  const filtered = contributions.filter((c) => matchesSearch(c, brotherNames, searchTerm))

  return (
    <>
      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por irmão, mês, ano ou status..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <MembershipContributionsTable
          rows={filtered}
          brotherNames={brotherNames}
          onEdit={onEdit}
          onDelete={onDelete}
          emptyMessage="Nenhuma mensalidade encontrada."
        />
      )}
    </>
  )
}

interface MembershipAllContributionsTabProps {
  contributions: Contribution[]
  brotherNames: Record<string, string>
  searchTerm: string
  onSearchTermChange: (value: string) => void
  loading: boolean
  onEdit: (contribution: Contribution) => void
  onDelete: (contribution: Contribution) => void
}
