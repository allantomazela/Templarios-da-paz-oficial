import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  applyLodgeMaterialMovement,
  createLodgeMaterial,
  deactivateLodgeMaterial,
  listLodgeMaterialMovements,
  listLodgeMaterials,
  updateLodgeMaterial,
} from '@/lib/lodge-materials-api'
import {
  isMaterialBelowMinimum,
  LODGE_MATERIAL_CATEGORY_LABELS,
  LODGE_MATERIAL_MOVEMENT_LABELS,
  type LodgeMaterial,
  type LodgeMaterialInput,
  type LodgeMaterialMovement,
  type LodgeMaterialMovementInput,
  type LodgeMaterialMovementType,
} from '@/lib/lodge-materials'
import { formatDateBR } from '@/lib/format-utils'
import useChancellorStore from '@/stores/useChancellorStore'
import { MaterialFormDialog } from './MaterialFormDialog'
import { MaterialMovementDialog } from './MaterialMovementDialog'

export function MaterialsManager() {
  const brothers = useChancellorStore((state) => state.brothers)
  const { toast } = useToast()
  const [materials, setMaterials] = useState<LodgeMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LodgeMaterial | null>(null)
  const [movementOpen, setMovementOpen] = useState(false)
  const [movementMaterial, setMovementMaterial] = useState<LodgeMaterial | null>(
    null,
  )
  const [movementType, setMovementType] =
    useState<LodgeMaterialMovementType>('entrada')
  const [historyMaterialId, setHistoryMaterialId] = useState<string | null>(null)
  const [history, setHistory] = useState<LodgeMaterialMovement[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const loadMaterials = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await listLodgeMaterials()
      setMaterials(rows)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível carregar',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadMaterials()
  }, [loadMaterials])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return materials
    return materials.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        LODGE_MATERIAL_CATEGORY_LABELS[item.category]
          .toLowerCase()
          .includes(term),
    )
  }, [materials, searchTerm])

  const lowStockCount = materials.filter(isMaterialBelowMinimum).length

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (material: LodgeMaterial) => {
    setEditing(material)
    setFormOpen(true)
  }

  const openMovement = (
    material: LodgeMaterial,
    type: LodgeMaterialMovementType,
  ) => {
    setMovementMaterial(material)
    setMovementType(type)
    setMovementOpen(true)
  }

  const handleSaveMaterial = async (input: LodgeMaterialInput) => {
    setBusy(true)
    try {
      if (editing) {
        await updateLodgeMaterial(editing.id, input)
        toast({ title: 'Material atualizado' })
      } else {
        await createLodgeMaterial(input)
        toast({ title: 'Material cadastrado' })
      }
      setFormOpen(false)
      await loadMaterials()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setBusy(false)
    }
  }

  const handleDeactivate = async (material: LodgeMaterial) => {
    if (
      !window.confirm(
        `Remover "${material.name}" da lista ativa? O histórico de movimentos é mantido.`,
      )
    ) {
      return
    }
    setBusy(true)
    try {
      await deactivateLodgeMaterial(material.id)
      toast({ title: 'Material removido da lista' })
      if (historyMaterialId === material.id) {
        setHistoryMaterialId(null)
        setHistory([])
      }
      await loadMaterials()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível remover',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setBusy(false)
    }
  }

  const handleMovement = async (input: LodgeMaterialMovementInput) => {
    if (!movementMaterial) return
    setBusy(true)
    try {
      await applyLodgeMaterialMovement(
        input,
        movementMaterial.quantityOnHand,
      )
      toast({ title: 'Movimento registrado' })
      setMovementOpen(false)
      await loadMaterials()
      if (historyMaterialId === movementMaterial.id) {
        const rows = await listLodgeMaterialMovements(movementMaterial.id)
        setHistory(rows)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível movimentar',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setBusy(false)
    }
  }

  const loadHistory = async (materialId: string) => {
    setHistoryMaterialId(materialId)
    setHistoryLoading(true)
    try {
      const rows = await listLodgeMaterialMovements(materialId)
      setHistory(rows)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível carregar o histórico',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setHistoryLoading(false)
    }
  }

  const brotherName = (id: string | null) => {
    if (!id) return '—'
    return brothers.find((brother) => brother.id === id)?.name ?? '—'
  }

  if (loading && materials.length === 0) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar material..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Novo material
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border bg-secondary/10 p-3">
          <span className="block text-xs text-muted-foreground">Itens ativos</span>
          <span className="text-lg font-bold">{materials.length}</span>
        </div>
        <div className="rounded-md border bg-secondary/10 p-3">
          <span className="block text-xs text-muted-foreground">
            Unidades em estoque
          </span>
          <span className="text-lg font-bold">
            {materials.reduce((sum, item) => sum + item.quantityOnHand, 0)}
          </span>
        </div>
        <div className="rounded-md border bg-secondary/10 p-3">
          <span className="block text-xs text-muted-foreground">
            Abaixo do mínimo
          </span>
          <span className="text-lg font-bold text-destructive">
            {lowStockCount}
          </span>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum material encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((material) => {
                const low = isMaterialBelowMinimum(material)
                return (
                  <TableRow key={material.id}>
                    <TableCell>
                      <div className="font-medium">{material.name}</div>
                      {material.notes ? (
                        <div className="text-xs text-muted-foreground">
                          {material.notes}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {LODGE_MATERIAL_CATEGORY_LABELS[material.category]}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <span>
                          {material.quantityOnHand} {material.unit}
                        </span>
                        {low ? (
                          <Badge variant="destructive">Baixo</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {material.minimumQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          title="Entrada"
                          onClick={() => openMovement(material, 'entrada')}
                        >
                          <ArrowDownLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          title="Saída"
                          onClick={() => openMovement(material, 'saida')}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          title="Ajuste"
                          onClick={() => openMovement(material, 'ajuste')}
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => void loadHistory(material.id)}
                        >
                          Histórico
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(material)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => void handleDeactivate(material)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {historyMaterialId && (
        <div className="space-y-2 rounded-md border p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              Histórico —{' '}
              {materials.find((item) => item.id === historyMaterialId)?.name ??
                'Material'}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setHistoryMaterialId(null)
                setHistory([])
              }}
            >
              Fechar
            </Button>
          </div>
          {historyLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há movimentos neste material.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Irmão</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {formatDateBR(row.movedAt.slice(0, 10))}
                    </TableCell>
                    <TableCell>
                      {LODGE_MATERIAL_MOVEMENT_LABELS[row.movementType]}
                    </TableCell>
                    <TableCell className="text-right">{row.quantity}</TableCell>
                    <TableCell>
                      {row.quantityBefore} → {row.quantityAfter}
                    </TableCell>
                    <TableCell>{brotherName(row.brotherId)}</TableCell>
                    <TableCell>{row.reason || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      <MaterialFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        material={editing}
        busy={busy}
        onSave={(input) => void handleSaveMaterial(input)}
      />
      <MaterialMovementDialog
        open={movementOpen}
        onOpenChange={setMovementOpen}
        material={movementMaterial}
        brothers={brothers}
        initialType={movementType}
        busy={busy}
        onSave={(input) => void handleMovement(input)}
      />
    </div>
  )
}
