import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import type { Brother } from '@/lib/data'
import {
  Flower2,
  HeartPulse,
  MoreHorizontal,
  Eye,
  Pencil,
  UserCheck,
  UserX,
  Trash2,
} from 'lucide-react'
import {
  inferMembershipSituation,
  MEMBERSHIP_SITUATION_LABELS,
  type MembershipSituation,
} from '@/lib/brother-membership-situation'
import type { BrothersRosterTab } from './brothers-roster-tab'

function situationBadgeClass(situation: MembershipSituation) {
  if (situation === 'desligado') return ''
  if (situation === 'in_memoriam') {
    return 'bg-slate-600 hover:bg-slate-700 text-white'
  }
  if (situation === 'afastado') {
    return 'bg-amber-600 hover:bg-amber-700 text-white'
  }
  return 'bg-green-600 hover:bg-green-700'
}

function situationBadgeVariant(situation: MembershipSituation) {
  if (situation === 'desligado') return 'destructive' as const
  return 'default' as const
}

function emptyMessage(rosterTab: BrothersRosterTab) {
  if (rosterTab === 'ativos') return 'Nenhum irmão ativo encontrado.'
  if (rosterTab === 'desligados') return 'Nenhum irmão desligado.'
  return 'Nenhum irmão In Memoriam.'
}

export interface BrothersRosterViewsProps {
  brothers: Brother[]
  loading: boolean
  rosterTab: BrothersRosterTab
  canDeleteBrother: (brother: Brother) => boolean
  onDetails: (brother: Brother) => void
  onEdit: (brother: Brother) => void
  onSetSituation: (brother: Brother, situation: MembershipSituation) => void
  onDelete: (brother: Brother) => void
}

export function BrothersRosterViews({
  brothers,
  loading,
  rosterTab,
  canDeleteBrother,
  onDetails,
  onEdit,
  onSetSituation,
  onDelete,
}: BrothersRosterViewsProps) {
  return (
    <>
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Grau</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">
                  Carregando irmãos...
                </TableCell>
              </TableRow>
            ) : brothers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">
                  {emptyMessage(rosterTab)}
                </TableCell>
              </TableRow>
            ) : (
              brothers.map((brother) => {
                const situation = inferMembershipSituation(brother)
                return (
                  <TableRow key={brother.id}>
                    <TableCell className="font-medium">{brother.name}</TableCell>
                    <TableCell>{brother.degree}</TableCell>
                    <TableCell>{brother.role}</TableCell>
                    <TableCell>
                      <Badge
                        variant={situationBadgeVariant(situation)}
                        className={situationBadgeClass(situation)}
                      >
                        {MEMBERSHIP_SITUATION_LABELS[situation]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <BrotherActionsMenu
                        brother={brother}
                        situation={situation}
                        canDelete={canDeleteBrother(brother)}
                        onDetails={onDetails}
                        onEdit={onEdit}
                        onSetSituation={onSetSituation}
                        onDelete={onDelete}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-md border py-8 text-center text-muted-foreground">
            Carregando irmãos...
          </div>
        ) : brothers.length === 0 ? (
          <div className="rounded-md border py-8 text-center text-muted-foreground">
            {emptyMessage(rosterTab)}
          </div>
        ) : (
          brothers.map((brother) => {
            const situation = inferMembershipSituation(brother)
            return (
              <Card key={brother.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{brother.name}</h3>
                      <p className="text-xs text-muted-foreground">{brother.role}</p>
                    </div>
                    <Badge
                      variant={situationBadgeVariant(situation)}
                      className={`${situationBadgeClass(situation)} text-[10px]`}
                    >
                      {MEMBERSHIP_SITUATION_LABELS[situation]}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {brother.degree}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDetails(brother)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(brother)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {situation !== 'desligado' &&
                        situation !== 'in_memoriam' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onSetSituation(brother, 'desligado')}
                            aria-label={`Desligar ${brother.name}`}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      {situation !== 'in_memoriam' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSetSituation(brother, 'in_memoriam')}
                          aria-label={`In Memoriam ${brother.name}`}
                        >
                          <Flower2 className="h-4 w-4" />
                        </Button>
                      )}
                      {situation !== 'regular' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => onSetSituation(brother, 'regular')}
                          aria-label={`Reativar ${brother.name}`}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteBrother(brother) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete(brother)}
                          aria-label={`Excluir ${brother.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </>
  )
}

function BrotherActionsMenu({
  brother,
  situation,
  canDelete,
  onDetails,
  onEdit,
  onSetSituation,
  onDelete,
}: {
  brother: Brother
  situation: MembershipSituation
  canDelete: boolean
  onDetails: (brother: Brother) => void
  onEdit: (brother: Brother) => void
  onSetSituation: (brother: Brother, situation: MembershipSituation) => void
  onDelete: (brother: Brother) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onDetails(brother)}>
          <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(brother)}>
          <Pencil className="mr-2 h-4 w-4" /> Editar
        </DropdownMenuItem>
        {situation !== 'afastado' &&
          situation !== 'desligado' &&
          situation !== 'in_memoriam' && (
            <DropdownMenuItem onClick={() => onSetSituation(brother, 'afastado')}>
              <HeartPulse className="mr-2 h-4 w-4" />
              Afastamento (saúde)
            </DropdownMenuItem>
          )}
        {situation !== 'desligado' && situation !== 'in_memoriam' && (
          <DropdownMenuItem
            onClick={() => onSetSituation(brother, 'desligado')}
            className="text-destructive"
          >
            <UserX className="mr-2 h-4 w-4" />
            Registrar desligamento
          </DropdownMenuItem>
        )}
        {situation !== 'in_memoriam' && (
          <DropdownMenuItem onClick={() => onSetSituation(brother, 'in_memoriam')}>
            <Flower2 className="mr-2 h-4 w-4" />
            Marcar In Memoriam
          </DropdownMenuItem>
        )}
        {situation !== 'regular' && (
          <DropdownMenuItem
            onClick={() => onSetSituation(brother, 'regular')}
            className="text-green-600"
          >
            <UserCheck className="mr-2 h-4 w-4" />
            Reativar (regular)
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(brother)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
