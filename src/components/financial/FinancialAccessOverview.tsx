import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Users } from 'lucide-react'
import {
  fetchFinancialAccessMembers,
  formatLodgePositionLabel,
  formatSystemRoleLabel,
  type FinancialAccessMember,
} from '@/lib/brother-profile-access'

interface FinancialAccessOverviewProps {
  onSelectBrother?: (profileId: string) => void
}

export function FinancialAccessOverview({
  onSelectBrother,
}: FinancialAccessOverviewProps) {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<FinancialAccessMember[]>([])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchFinancialAccessMembers()
        if (!cancelled) setMembers(data)
      } catch (error) {
        console.error('Erro ao carregar equipe financeira:', error)
        if (!cancelled) setMembers([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5" />
          Gestão financeira e administradores
        </CardTitle>
        <CardDescription>
          Irmãos com papel de administrador, editor (tesouraria) ou cargo de
          tesoureiro na loja.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando...
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum administrador ou tesoureiro cadastrado.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Irmão</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papéis</TableHead>
                  {onSelectBrother ? (
                    <TableHead className="text-right">Ação</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.profileId}>
                    <TableCell className="font-medium">{member.fullName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {member.email || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.systemRole === 'admin' ||
                        member.systemRole === 'editor' ? (
                          <Badge
                            variant={
                              member.systemRole === 'admin'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {formatSystemRoleLabel(member.systemRole)}
                          </Badge>
                        ) : null}
                        {member.lodgePositions.map((position) => (
                          <Badge
                            key={position}
                            variant="outline"
                            className={
                              position === 'tesoureiro'
                                ? 'border-emerald-600 text-emerald-700'
                                : undefined
                            }
                          >
                            {formatLodgePositionLabel(position)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    {onSelectBrother ? (
                      <TableCell className="text-right">
                        <button
                          type="button"
                          className="text-sm text-primary hover:underline"
                          onClick={() => onSelectBrother(member.profileId)}
                        >
                          Ver mensalidades
                        </button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
