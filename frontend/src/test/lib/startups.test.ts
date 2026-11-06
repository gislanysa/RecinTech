import {
  buscarStartups,
  carregarTagsDaStartup,
  LIMITE_PADRAO_STARTUPS,
  listarStartups,
  OFFSET_PADRAO_STARTUPS,
  STARTUPS_MOCK,
} from '@/lib/startups.ts'
import { api, type Startup as StartupReal } from '@/lib/api.ts'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api.ts', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('startups.ts - Paginação e integração com a API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve chamar api.get com limit e offset padrões em buscarStartups', async () => {
    const mockData: StartupReal[] = [
      {
        id: 'startup-1',
        name: 'Recicla Já',
        email: 'contato@reciclaja.com',
        cnpj: '12345678000190',
        stage: 'scaling',
        description: 'Plataforma de coleta sustentável',
        city: 'Recife',
        state: 'PE',
        website: 'https://reciclaja.com',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
      },
    ]

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockData })

    const resultado = await buscarStartups()

    expect(api.get).toHaveBeenCalledWith('/startup', {
      params: {
        limit: LIMITE_PADRAO_STARTUPS,
        offset: OFFSET_PADRAO_STARTUPS,
      },
    })
    expect(resultado).toEqual(mockData)
  })

  it('deve sanitizar parâmetros negativos ou fracionários em buscarStartups', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] })

    await buscarStartups(12.7, -5)

    expect(api.get).toHaveBeenCalledWith('/startup', {
      params: {
        limit: 12,
        offset: 0,
      },
    })
  })

  it('deve listar startups e mapear para o modelo StartupCatalogo', async () => {
    const mockReal: StartupReal[] = [
      {
        id: 'startup-teste',
        name: 'Eco Solution',
        email: 'contato@ecosolution.com',
        cnpj: '98765432000100',
        stage: 'traction',
        description: 'Solução verde para indústrias',
        city: 'Recife',
        state: 'PE',
        website: 'https://ecosolution.com',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
      },
    ]

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockReal })

    const catalogo = await listarStartups({ limit: 50, offset: 0 })

    expect(catalogo).toHaveLength(1)
    expect(catalogo[0].id).toBe('startup-teste')
    expect(catalogo[0].name).toBe('Eco Solution')
    expect(catalogo[0].slug).toBe('eco-solution')
    expect(catalogo[0].initials).toBe('ES')
    expect(catalogo[0].tagline).toBe('Solução verde para indústrias')
  })

  it('deve retornar STARTUPS_MOCK quando a chamada para a API falhar', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Falha de conexão com a API'))

    const startups = await listarStartups({ limit: 10, offset: 0 })

    expect(startups).toEqual(STARTUPS_MOCK)
  })

  it('deve enriquecer tags via carregarTagsDaStartup', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [{ id: '1', name: 'Reciclagem' }] }) // segments
      .mockResolvedValueOnce({ data: [{ id: '2', name: 'Coleta' }] }) // services
      .mockResolvedValueOnce({ data: [{ id: '3', name: 'Sustentabilidade' }] }) // expertises
      .mockResolvedValueOnce({ data: [{ id: '4', name: 'React' }] }) // technologies

    const tags = await carregarTagsDaStartup('startup-123')

    expect(tags.area).toBe('Sustentabilidade')
    expect(tags.segments).toEqual(['Reciclagem'])
    expect(tags.services).toEqual(['Coleta'])
    expect(tags.technologies).toEqual(['React'])
  })
})
