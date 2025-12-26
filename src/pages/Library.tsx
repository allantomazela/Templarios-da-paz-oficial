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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { mockLibrary } from '@/lib/data'
import { Search, FileText, Download, Lock, AlertCircle } from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import { useState, useMemo } from 'react'

type MasonicDegree = 'Aprendiz' | 'Companheiro' | 'Mestre'

/**
 * Verifica se um usuário pode acessar material de um determinado grau
 * Regras:
 * - Grau I (Aprendiz): só acessa material de Grau I
 * - Grau II (Companheiro): acessa material de Grau I e Grau II
 * - Grau III (Mestre): acessa tudo
 */
function canAccessDegree(
  userDegree: MasonicDegree | undefined | null,
  materialDegree: MasonicDegree,
): boolean {
  // Se não tem grau definido, não acessa nada
  if (!userDegree) return false

  // Mestre acessa tudo
  if (userDegree === 'Mestre') return true

  // Companheiro acessa Aprendiz e Companheiro
  if (userDegree === 'Companheiro') {
    return materialDegree === 'Aprendiz' || materialDegree === 'Companheiro'
  }

  // Aprendiz só acessa Aprendiz
  if (userDegree === 'Aprendiz') {
    return materialDegree === 'Aprendiz'
  }

  // Caso padrão: não acessa
  return false
}

/**
 * Retorna os graus que o usuário pode acessar
 */
function getAccessibleDegrees(
  userDegree: MasonicDegree | undefined | null,
): MasonicDegree[] {
  if (!userDegree) return []

  if (userDegree === 'Mestre') {
    return ['Aprendiz', 'Companheiro', 'Mestre']
  }

  if (userDegree === 'Companheiro') {
    return ['Aprendiz', 'Companheiro']
  }

  if (userDegree === 'Aprendiz') {
    return ['Aprendiz']
  }

  return []
}

export default function LibraryPage() {
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')

  const userDegree = user?.profile?.masonic_degree as MasonicDegree | undefined

  // Obter graus acessíveis
  const accessibleDegrees = useMemo(
    () => getAccessibleDegrees(userDegree),
    [userDegree],
  )

  // Filtrar biblioteca rigorosamente
  const filteredLibrary = useMemo(() => {
    return mockLibrary.filter((item) => {
      // Verificar se o usuário pode acessar este material
      return canAccessDegree(userDegree, item.degree as MasonicDegree)
    })
  }, [userDegree])

  // Filtrar por termo de busca
  const searchFilteredLibrary = useMemo(() => {
    if (!searchTerm.trim()) return filteredLibrary

    const term = searchTerm.toLowerCase()
    return filteredLibrary.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.type.toLowerCase().includes(term) ||
        item.degree.toLowerCase().includes(term),
    )
  }, [filteredLibrary, searchTerm])

  // Tabs disponíveis baseadas no acesso
  const availableTabs = useMemo(() => {
    const tabs: Array<{ value: string; label: string }> = [
      { value: 'all', label: 'Todos' },
    ]

    if (accessibleDegrees.includes('Aprendiz')) {
      tabs.push({ value: 'Aprendiz', label: 'Grau I' })
    }
    if (accessibleDegrees.includes('Companheiro')) {
      tabs.push({ value: 'Companheiro', label: 'Grau II' })
    }
    if (accessibleDegrees.includes('Mestre')) {
      tabs.push({ value: 'Mestre', label: 'Grau III' })
    }

    return tabs
  }, [accessibleDegrees])

  // Verificar se usuário não tem grau definido
  const hasNoDegree = !userDegree

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

      {/* Alerta se não tem grau definido */}
      {hasNoDegree && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Acesso Restrito:</strong> Seu perfil não possui grau maçônico
            definido. Entre em contato com a administração para ter acesso aos
            materiais da biblioteca.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta informativo sobre acesso */}
      {!hasNoDegree && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Você tem acesso aos materiais dos seguintes graus:{' '}
            <strong>
              {accessibleDegrees
                .map((d) => {
                  if (d === 'Aprendiz') return 'Grau I'
                  if (d === 'Companheiro') return 'Grau II'
                  return 'Grau III'
                })
                .join(', ')}
            </strong>
            . Materiais de outros graus não estão disponíveis para seu nível.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center space-x-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Pesquisar material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {hasNoDegree ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Lock className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">
            Acesso Restrito
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Você precisa ter um grau maçônico definido para acessar os materiais
            da biblioteca.
          </p>
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {availableTabs.map((tab) => {
            // Filtrar materiais por tab, mas sempre respeitando o acesso do usuário
            const tabMaterials = searchFilteredLibrary.filter((item) => {
              if (tab.value === 'all') return true
              return item.degree === tab.value
            })

            return (
              <TabsContent key={tab.value} value={tab.value} className="mt-6">
                {tabMaterials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Nenhum material encontrado
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {searchTerm
                        ? 'Tente ajustar sua busca'
                        : 'Não há materiais disponíveis nesta categoria'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {tabMaterials.map((item) => {
                      // Validação adicional: garantir que o item é acessível
                      const isAccessible = canAccessDegree(
                        userDegree,
                        item.degree as MasonicDegree,
                      )

                      if (!isAccessible) {
                        // Não deveria acontecer, mas por segurança não renderiza
                        return null
                      }

                      return (
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
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      )}
    </div>
  )
}
