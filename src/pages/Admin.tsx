import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { mockBrothers } from '@/lib/data'
import { Check, X } from 'lucide-react'

export default function Admin() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Gestão de Usuários
        </h2>
        <p className="text-muted-foreground">Área administrativa.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Cadastro</CardTitle>
          <CardDescription>
            Aprove ou rejeite novos registros de irmãos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Grau Solicitado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Ricardo Almeida</TableCell>
                <TableCell>ricardo@exemplo.com</TableCell>
                <TableCell>Aprendiz</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-500 hover:text-green-600 border-green-500/50 hover:bg-green-500/10"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-600 border-red-500/50 hover:bg-red-500/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissões</CardTitle>
          <CardDescription>
            Gerencie as funções dos irmãos na loja.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo Atual</TableHead>
                <TableHead>Grau</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBrothers.slice(0, 3).map((brother) => (
                <TableRow key={brother.id}>
                  <TableCell>{brother.name}</TableCell>
                  <TableCell>{brother.role}</TableCell>
                  <TableCell>{brother.degree}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
