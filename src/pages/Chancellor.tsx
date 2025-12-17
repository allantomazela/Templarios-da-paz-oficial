import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { mockEvents, mockBrothers } from '@/lib/data'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function Chancellor() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSavePresence = () => {
    toast({
      title: 'Presença Salva',
      description: 'Os registros de presença foram atualizados com sucesso.',
    })
    setSelectedEvent(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Chancelaria</h2>
        <p className="text-muted-foreground">
          Controle de presença e estatísticas.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sessões e Eventos</CardTitle>
            <CardDescription>
              Selecione um evento para realizar a chamada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.date}</TableCell>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>{event.location}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedEvent(event.id)}
                          >
                            Registrar Presença
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Chamada - {event.title}</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-[400px] w-full pr-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Irmão</TableHead>
                                  <TableHead>Presente</TableHead>
                                  <TableHead>Justificado</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {mockBrothers.map((brother) => (
                                  <TableRow key={brother.id}>
                                    <TableCell>{brother.name}</TableCell>
                                    <TableCell>
                                      <Checkbox />
                                    </TableCell>
                                    <TableCell>
                                      <Checkbox />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                          <DialogFooter>
                            <Button onClick={handleSavePresence}>Salvar</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
