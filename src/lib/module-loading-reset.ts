import { useAgapeStore } from '@/stores/useAgapeStore'
import useFinancialStore from '@/stores/useFinancialStore'
import useChancellorStore from '@/stores/useChancellorStore'

/** Zera flags de loading que podem ficar presas após troca rápida de módulo (mobile). */
export function resetStuckModuleLoading(): void {
  useAgapeStore.getState().resetLoadingFlags()
  useFinancialStore.getState().resetLoadingFlags()
  useChancellorStore.getState().resetLoadingFlags()
}