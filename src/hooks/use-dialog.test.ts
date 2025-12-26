import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDialog } from './use-dialog'

describe('useDialog', () => {
  it('deve inicializar com estado fechado por padrão', () => {
    const { result } = renderHook(() => useDialog())
    expect(result.current.open).toBe(false)
  })

  it('deve inicializar com estado aberto se especificado', () => {
    const { result } = renderHook(() => useDialog(true))
    expect(result.current.open).toBe(true)
  })

  it('deve abrir o dialog quando openDialog é chamado', () => {
    const { result } = renderHook(() => useDialog())
    
    act(() => {
      result.current.openDialog()
    })

    expect(result.current.open).toBe(true)
  })

  it('deve fechar o dialog quando closeDialog é chamado', () => {
    const { result } = renderHook(() => useDialog(true))
    
    act(() => {
      result.current.closeDialog()
    })

    expect(result.current.open).toBe(false)
  })

  it('deve alternar o estado quando toggle é chamado', () => {
    const { result } = renderHook(() => useDialog())
    
    act(() => {
      result.current.toggle()
    })

    expect(result.current.open).toBe(true)

    act(() => {
      result.current.toggle()
    })

    expect(result.current.open).toBe(false)
  })

  it('deve atualizar estado quando onOpenChange é chamado', () => {
    const { result } = renderHook(() => useDialog())
    
    act(() => {
      result.current.onOpenChange(true)
    })

    expect(result.current.open).toBe(true)

    act(() => {
      result.current.onOpenChange(false)
    })

    expect(result.current.open).toBe(false)
  })
})

