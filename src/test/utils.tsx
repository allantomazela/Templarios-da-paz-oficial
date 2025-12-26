/**
 * Utilitários para testes
 */

import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'

/**
 * Wrapper customizado para renderizar componentes com providers necessários
 */
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <TooltipProvider>{children}</TooltipProvider>
    </BrowserRouter>
  )
}

/**
 * Renderiza um componente com todos os providers necessários
 * 
 * @param ui - Componente a ser renderizado
 * @param options - Opções de renderização
 * @returns Resultado da renderização
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Re-exporta tudo do testing-library
export * from '@testing-library/react'
export { customRender as render }

