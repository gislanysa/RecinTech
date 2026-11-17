import { useDemandas } from '@/hooks/useDemandas.ts'
import * as demandasLib from '@/lib/demandas.ts'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/demandas.ts', () => ({
  listarDemandas: vi.fn(),
}))

describe('Hook useDemandas', () => {
  const companyId = 'empresa-test-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve carregar todas as demandas quando não há paginação', async () => {
    const mockDemandas: demandasLib.Demanda[] = [
      {
        id: 'dem-1',
        company_id: companyId,
        titulo: 'Demanda 1',
        descricao: 'Desc 1',
        segmento: 'Agritech',
        servicos: [],
        tecnologias: [],
        status: 'aberta',
        created_at: '2026-01-01T00:00:00Z',
      },
    ]

    vi.mocked(demandasLib.listarDemandas).mockResolvedValueOnce(mockDemandas)

    const { result } = renderHook(() => useDemandas({ companyId }))

    expect(result.current.carregando).toBe(true)

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(result.current.demandas).toEqual(mockDemandas)
    expect(result.current.erro).toBeNull()
    expect(result.current.temProximaPagina).toBe(false)
    expect(demandasLib.listarDemandas).toHaveBeenCalledWith(companyId)
  })

  it('deve desabilitar proximaPagina quando o número de itens for exatamente igual a porPagina (evita página vazia)', async () => {
    const porPagina = 10
    // Simula 10 itens retornados quando solicitados 11 (porPagina + 1)
    const mock10Itens: demandasLib.Demanda[] = Array.from({ length: 10 }, (_, i) => ({
      id: `dem-${i + 1}`,
      company_id: companyId,
      titulo: `Demanda ${i + 1}`,
      descricao: `Desc ${i + 1}`,
      segmento: 'Cleantech',
      servicos: [],
      tecnologias: [],
      status: 'aberta',
      created_at: '2026-01-01T00:00:00Z',
    }))

    vi.mocked(demandasLib.listarDemandas).mockResolvedValueOnce(mock10Itens)

    const { result } = renderHook(() => useDemandas({ companyId, porPagina }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    // Solicitou 11 (porPagina + 1) e offset 0
    expect(demandasLib.listarDemandas).toHaveBeenCalledWith(companyId, 11, 0)
    expect(result.current.demandas.length).toBe(10)
    // Como retornou 10 (<= 10), NÃO há próxima página
    expect(result.current.temProximaPagina).toBe(false)
  })

  it('deve habilitar proximaPagina e fatiar itens quando houver mais de porPagina', async () => {
    const porPagina = 10
    // Simula 11 itens retornados
    const mock11Itens: demandasLib.Demanda[] = Array.from({ length: 11 }, (_, i) => ({
      id: `dem-${i + 1}`,
      company_id: companyId,
      titulo: `Demanda ${i + 1}`,
      descricao: `Desc ${i + 1}`,
      segmento: 'Cleantech',
      servicos: [],
      tecnologias: [],
      status: 'aberta',
      created_at: '2026-01-01T00:00:00Z',
    }))

    vi.mocked(demandasLib.listarDemandas).mockResolvedValueOnce(mock11Itens)

    const { result } = renderHook(() => useDemandas({ companyId, porPagina }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    // Exibe apenas 10
    expect(result.current.demandas.length).toBe(10)
    // Sabe que tem próxima página
    expect(result.current.temProximaPagina).toBe(true)

    // Navega para a próxima página
    const mockPagina2: demandasLib.Demanda[] = [mock11Itens[10]]
    vi.mocked(demandasLib.listarDemandas).mockResolvedValueOnce(mockPagina2)

    act(() => {
      result.current.proximaPagina()
    })

    await waitFor(() => {
      expect(result.current.pagina).toBe(1)
    })

    expect(demandasLib.listarDemandas).toHaveBeenCalledWith(companyId, 11, 10)
  })

  it('deve atualizar localmente demandas com salvarDemandaLocal e removerDemandaLocal', async () => {
    const d1: demandasLib.Demanda = {
      id: 'dem-1',
      company_id: companyId,
      titulo: 'Demanda 1',
      descricao: 'Desc 1',
      segmento: 'Agritech',
      servicos: [],
      tecnologias: [],
      status: 'aberta',
      created_at: '2026-01-01T00:00:00Z',
    }

    vi.mocked(demandasLib.listarDemandas).mockResolvedValueOnce([d1])

    const { result } = renderHook(() => useDemandas({ companyId }))

    await waitFor(() => {
      expect(result.current.demandas.length).toBe(1)
    })

    // Adiciona nova demanda
    const nova: demandasLib.Demanda = {
      ...d1,
      id: 'dem-nova',
      titulo: 'Demanda Nova',
    }

    act(() => {
      result.current.salvarDemandaLocal(nova)
    })

    expect(result.current.demandas.length).toBe(2)
    expect(result.current.demandas[0].id).toBe('dem-nova')

    // Atualiza demanda existente
    const atualizada: demandasLib.Demanda = {
      ...nova,
      titulo: 'Demanda Nova Modificada',
    }

    act(() => {
      result.current.salvarDemandaLocal(atualizada)
    })

    expect(result.current.demandas.length).toBe(2)
    expect(result.current.demandas[0].titulo).toBe('Demanda Nova Modificada')

    // Remove demanda
    act(() => {
      result.current.removerDemandaLocal('dem-nova')
    })

    expect(result.current.demandas.length).toBe(1)
    expect(result.current.demandas[0].id).toBe('dem-1')
  })

  it('deve tratar erros de requisição sem quebrar', async () => {
    vi.mocked(demandasLib.listarDemandas).mockRejectedValueOnce(new Error('Falha de rede'))

    const { result } = renderHook(() => useDemandas({ companyId }))

    await waitFor(() => {
      expect(result.current.carregando).toBe(false)
    })

    expect(result.current.erro).toBe('Não foi possível carregar as demandas da empresa.')
    expect(result.current.demandas).toEqual([])
  })
})
