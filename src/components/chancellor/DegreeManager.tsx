import { useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import useChancellorStore from '@/stores/useChancellorStore'
import { toDateInputValue } from '@/lib/format-utils'
import { Brother } from '@/lib/data'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { saveBrotherDegreeInfo } from '@/lib/chancellor-degree-api'
import { coerceMasonicDegree } from '@/lib/masonic-degree'
import {
  brotherMatchesDegreeSearch,
  partitionDegreeRoster,
} from '@/lib/degree-roster'
import { DegreeEditDialog, type DegreeFormData } from './DegreeEditDialog'
import { DegreeRosterTable } from './DegreeRosterTable'

const EMPTY_FORM: DegreeFormData = {
  degree: 'Aprendiz',
  initiationDate: '',
  elevationDate: '',
  exaltationDate: '',
}

export function DegreeManager() {
  const { brothers, updateBrotherDegree } = useChancellorStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [editingBrother, setEditingBrother] = useState<Brother | null>(null)
  const [formData, setFormData] = useState<DegreeFormData>(EMPTY_FORM)
  const dialog = useDialog()

  const filtered = useMemo(
    () => brothers.filter((brother) => brotherMatchesDegreeSearch(brother, searchTerm)),
    [brothers, searchTerm],
  )
  const roster = useMemo(() => partitionDegreeRoster(filtered), [filtered])
  const searching = searchTerm.trim().length > 0

  const saveOperation = useAsyncOperation(
    async () => {
      if (!editingBrother) return null
      const saved = await saveBrotherDegreeInfo(editingBrother.id, {
        degree: coerceMasonicDegree(formData.degree),
        initiationDate: formData.initiationDate,
        elevationDate: formData.elevationDate,
        exaltationDate: formData.exaltationDate,
      })
      updateBrotherDegree(editingBrother.id, saved)
      return `Registro do Ir. ${editingBrother.name} atualizado com sucesso.`
    },
    {
      successMessage: 'Dados atualizados com sucesso!',
      errorMessage: 'Falha ao atualizar os dados.',
    },
  )

  function handleEdit(brother: Brother) {
    setEditingBrother(brother)
    setFormData({
      degree: brother.degree,
      initiationDate: toDateInputValue(brother.initiationDate),
      elevationDate: toDateInputValue(brother.elevationDate),
      exaltationDate: toDateInputValue(brother.exaltationDate),
    })
    dialog.openDialog()
  }

  async function handleSave() {
    const result = await saveOperation.execute()
    if (result) dialog.closeDialog()
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Controle de alterações de grau</h3>
        <p className="text-sm text-muted-foreground">
          O quadro ativo fica nesta lista. Desligados e In Memoriam ficam no grupo
          de baixo e continuam editáveis.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar irmão ou CIM..."
          className="pl-8"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Buscar irmão ou CIM"
        />
      </div>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quadro ativo ({roster.active.length})
        </h4>
        <DegreeRosterTable
          brothers={roster.active}
          emptyLabel="Nenhum irmão do quadro ativo neste filtro."
          onEdit={handleEdit}
        />
      </section>

      <Collapsible key={searching ? 'search-open' : 'browse'} defaultOpen={searching}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-left text-sm font-medium hover:bg-accent data-[state=open]:[&_svg]:rotate-180">
          <span>
            Desligados e In Memoriam
            <span className="ml-2 text-muted-foreground">({roster.inactive.length})</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <DegreeRosterTable
            brothers={roster.inactive}
            emptyLabel="Nenhum irmão desligado ou In Memoriam neste filtro."
            onEdit={handleEdit}
          />
        </CollapsibleContent>
      </Collapsible>

      <DegreeEditDialog
        open={dialog.open}
        brotherName={editingBrother?.name ?? 'irmão'}
        formData={formData}
        saving={saveOperation.loading}
        onOpenChange={dialog.onOpenChange}
        onChange={setFormData}
        onCancel={() => dialog.closeDialog()}
        onSave={() => {
          void handleSave()
        }}
      />
    </div>
  )
}
