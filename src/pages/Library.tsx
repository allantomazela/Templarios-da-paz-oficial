import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { mockLibrary } from '@/lib/data'
import { Search, FileText, Download } from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'

export default function LibraryPage() {
  const { user } = useAuthStore()

  // Logic to show materials based on user degree (Mocked)
  // Apprentice sees Apprentice materials
  // Master sees all
  const filteredLibrary = mockLibrary.filter((item) => {
    if (user?.degree === 'Mestre') return true
    if (user?.degree === 'Companheiro') return item.degree !== 'Mestre'
    return item.degree === 'Aprendiz'
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Biblioteca Virtual
        </h2>
        <p className="text-muted-foreground">
          Acervo de estudos e documentos maçônicos.
        </p>
      </div>

      <div className="flex items-center space-x-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Pesquisar material..." />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="Aprendiz">Grau I</TabsTrigger>
          <TabsTrigger value="Companheiro">Grau II</TabsTrigger>
          <TabsTrigger value="Mestre">Grau III</TabsTrigger>
        </TabsList>

        {['all', 'Aprendiz', 'Companheiro', 'Mestre'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredLibrary
                .filter((item) => tab === 'all' || item.degree === tab)
                .map((item) => (
                  <Card
                    key={item.id}
                    className="hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <CardHeader className="bg-secondary/10 pb-4">
                      <div className="flex justify-center py-4 text-primary group-hover:scale-110 transition-transform">
                        <FileText className="h-16 w-16" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <CardTitle className="text-base line-clamp-2">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="mt-2 text-xs">
                        Grau: {item.degree} • Tipo: {item.type}
                      </CardDescription>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" /> Baixar
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
