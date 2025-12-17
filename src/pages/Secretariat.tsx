import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, MoreHorizontal, FileText, Mail } from 'lucide-react'
import { mockBrothers, mockAnnouncements } from '@/lib/data'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Secretariat() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredBrothers = mockBrothers.filter(
    (brother) =>
      brother.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brother.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Secretaria</h2>
          <p className="text-muted-foreground">
            Gestão de irmãos e comunicações da loja.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Novo Registro
        </Button>
      </div>

      <Tabs defaultValue="brothers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="brothers">Irmãos</TabsTrigger>
          <TabsTrigger value="communications">Comunicações</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="brothers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de Irmãos</CardTitle>
                  <CardDescription>
                    Gerencie o quadro de obreiros da loja.
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
                  {filteredBrothers.map((brother) => (
                    <TableRow key={brother.id}>
                      <TableCell className="font-medium">
                        {brother.name}
                      </TableCell>
                      <TableCell>{brother.degree}</TableCell>
                      <TableCell>{brother.role}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            brother.status === 'Ativo'
                              ? 'default'
                              : 'destructive'
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
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Desativar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Mural de Avisos</CardTitle>
                  <CardDescription>Anúncios oficiais da loja.</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="mr-2 h-3 w-3" /> Novo
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockAnnouncements.map((ann) => (
                  <div key={ann.id} className="border p-4 rounded-md">
                    <h4 className="font-bold">{ann.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {ann.date} - por {ann.author}
                    </p>
                    <p className="text-sm">{ann.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Mensagens Internas</CardTitle>
                  <CardDescription>Comunicação direta.</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <Mail className="mr-2 h-3 w-3" /> Escrever
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Mail className="h-10 w-10 mb-2 opacity-20" />
                  <p>Nenhuma mensagem nova.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <CardTitle>Documentos da Loja</CardTitle>
              <CardDescription>Atas, Estatutos e Regulamentos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  'Estatuto Social',
                  'Regimento Interno',
                  'Ata da Última Sessão',
                  'Balaústre 245',
                ].map((doc, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-secondary/20 cursor-pointer transition-colors"
                  >
                    <FileText className="h-12 w-12 text-primary mb-3" />
                    <span className="text-center text-sm font-medium">
                      {doc}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
