import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Brother, mockBrothers } from '@/lib/data'
import { MoreHorizontal, Search, Plus, Eye, Pencil, Power } from 'lucide-react'
import { BrotherDialog } from './BrotherDialog'
import { BrotherDetails } from './BrotherDetails'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

export function BrothersList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [degreeFilter, setDegreeFilter] = useState('all')
  const [brothers, setBrothers] = useState<Brother[]>(mockBrothers)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedBrother, setSelectedBrother] = useState<Brother | null>(null)
  const { toast } = useToast()

  const filteredBrothers = brothers.filter((brother) => {
    const matchesSearch =
      brother.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brother.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || brother.status === statusFilter
    const matchesDegree =
      degreeFilter === 'all' || brother.degree === degreeFilter
    return matchesSearch && matchesStatus && matchesDegree
  })

  const handleSave = (data: any) => {
    if (selectedBrother) {
      setBrothers(
        brothers.map((b) =>
          b.id === selectedBrother.id ? { ...b, ...data } : b,
        ),
      )
      toast({ title: 'Sucesso', description: 'Irmão atualizado com sucesso.' })
    } else {
      const newBrother: Brother = {
        id: String(brothers.length + 1),
        role: 'Irmão',
        status: 'Ativo',
        attendanceRate: 0,
        ...data,
      }
      setBrothers([...brothers, newBrother])
      toast({ title: 'Sucesso', description: 'Irmão adicionado com sucesso.' })
    }
    setIsDialogOpen(false)
  }

  const toggleStatus = (brother: Brother) => {
    const newStatus = brother.status === 'Ativo' ? 'Inativo' : 'Ativo'
    setBrothers(
      brothers.map((b) =>
        b.id === brother.id ? { ...b, status: newStatus } : b,
      ),
    )
    toast({
      title: 'Status Alterado',
      description: `Status de ${brother.name} alterado para ${newStatus}.`,
    })
  }

  const openEdit = (brother: Brother) => {
    setSelectedBrother(brother)
    setIsDialogOpen(true)
  }

  const openNew = () => {
    setSelectedBrother(null)
    setIsDialogOpen(true)
  }

  const openDetails = (brother: Brother) => {
    setSelectedBrother(brother)
    setIsDetailsOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={degreeFilter} onValueChange={setDegreeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Grau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Graus</SelectItem>
                <SelectItem value="Aprendiz">Aprendiz</SelectItem>
                <SelectItem value="Companheiro">Companheiro</SelectItem>
                <SelectItem value="Mestre">Mestre</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />{' '}
          <span className="hidden sm:inline">Adicionar</span> Irmão
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Grau</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBrothers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Nenhum irmão encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredBrothers.map((brother) => (
                <TableRow key={brother.id}>
                  <TableCell className="font-medium">{brother.name}</TableCell>
                  <TableCell>{brother.degree}</TableCell>
                  <TableCell>{brother.role}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        brother.status === 'Ativo' ? 'default' : 'destructive'
                      }
                      className={
                        brother.status === 'Ativo'
                          ? 'bg-green-600 hover:bg-green-700'
                          : ''
                      }
                    >
                      {brother.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openDetails(brother)}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(brother)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleStatus(brother)}
                          className={
                            brother.status === 'Ativo'
                              ? 'text-destructive'
                              : 'text-green-600'
                          }
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {brother.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredBrothers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            Nenhum irmão encontrado.
          </div>
        ) : (
          filteredBrothers.map((brother) => (
            <Card key={brother.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{brother.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {brother.role}
                    </p>
                  </div>
                  <Badge
                    variant={
                      brother.status === 'Ativo' ? 'default' : 'destructive'
                    }
                    className={
                      brother.status === 'Ativo'
                        ? 'bg-green-600 hover:bg-green-700 text-[10px]'
                        : 'text-[10px]'
                    }
                  >
                    {brother.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Badge variant="outline" className="text-xs">
                    {brother.degree}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetails(brother)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(brother)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <BrotherDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        brotherToEdit={selectedBrother}
        onSave={handleSave}
      />

      <BrotherDetails
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        brother={selectedBrother}
      />
    </div>
  )
}
