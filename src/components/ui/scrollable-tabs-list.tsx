/* ScrollableTabsList - envolve a TabsList do shadcn em um container com rolagem
   horizontal, evitando que barras de abas com muitos itens (ou rótulos longos)
   estourem o layout em telas estreitas (celular/tablet em retrato). */
import * as React from 'react'

import { TabsList } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export type ScrollableTabsListProps = React.ComponentPropsWithoutRef<
  typeof TabsList
>

export function ScrollableTabsList({
  className,
  ...props
}: ScrollableTabsListProps) {
  return (
    <div className="flex items-center overflow-x-auto">
      <TabsList
        className={cn('w-full justify-start md:w-auto', className)}
        {...props}
      />
    </div>
  )
}
