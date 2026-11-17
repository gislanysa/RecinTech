import {
  calcularCompatibilidadeDemanda,
  ignorarOportunidade,
  listarConexoes,
  listarOportunidades,
  manifestarInteresse,
} from '@/lib/oportunidades.ts'
import * as api from '@/lib/api.ts'
import * as demandasLib from '@/lib/demandas.ts'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api.ts', () => ({
  listarConexoesStartup: vi.fn(),
  responderConexaoStartup: vi.fn(),
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/lib/demandas.ts', () => ({
  buscarDemandasDisponiveis: vi.fn(),
  candidatarADemanda: vi.fn(),
  desistirCandidaturaDemanda: vi.fn(),
}))

vi.mock('@/lib/startups.ts', () => ({
  carregarTagsDaStartup: vi.fn(),
}))

describe('oportunidades.ts - listarConexoes', () => {
  const startupId = '01930000-0000-7000-0002-000000000001'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar lista vazia quando a startup não tiver conexões cadastradas', async () => {
    vi.mocked(api.listarConexoesStartup).mockResolvedValueOnce([])

    const resultado = await listarConexoes(startupId)

    expect(api.listarConexoesStartup).toHaveBeenCalledWith(startupId)
    expect(resultado.conexoes).toEqual([])
    expect(resultado.origem).toBe('api')
  })

  it('deve mapear conexões reais retornadas pela API', async () => {
    vi.mocked(api.listarConexoesStartup).mockResolvedValueOnce([
      {
        company: 'emp-123',
        startup: startupId,
        status: 'accepted',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      },
    ])

    const resultado = await listarConexoes(startupId)

    expect(resultado.conexoes).toHaveLength(1)
    expect(resultado.conexoes[0].company_id).toBe('emp-123')
    expect(resultado.conexoes[0].status).toBe('aceito')
    expect(resultado.origem).toBe('api')
  })

  it('deve retornar estado vazio sem injetar conexões simuladas se a API falhar', async () => {
    vi.mocked(api.listarConexoesStartup).mockRejectedValueOnce(new Error('Network error'))

    const resultado = await listarConexoes(startupId)

    expect(resultado.conexoes).toEqual([])
    expect(resultado.origem).toBe('api')
  })
})

describe('oportunidades.ts - calcularCompatibilidadeDemanda', () => {
  it('deve retornar 0 quando não houver correspondência entre startup e demanda', () => {
    const tagsStartup = {
      area: 'Saúde',
      segments: ['Saúde', 'Biotecnologia'],
      services: ['Consultoria'],
      technologies: ['Python'],
    }

    const demanda = {
      segmento: 'Agritech',
      servicos: ['Desenvolvimento Web'],
      tecnologias: ['React Native'],
    }

    const score = calcularCompatibilidadeDemanda(tagsStartup, demanda)
    expect(score).toBe(0)
  })

  it('deve calcular pontuação positiva quando houver similaridade em segmento, serviços ou tecnologias', () => {
    const tagsStartup = {
      area: 'Agritech',
      segments: ['Agritech'],
      services: ['Desenvolvimento Web'],
      technologies: ['React', 'Node.js'],
    }

    const demanda = {
      segmento: 'Agritech',
      servicos: ['Desenvolvimento Web'],
      tecnologias: ['React', 'PostgreSQL'],
    }

    const score = calcularCompatibilidadeDemanda(tagsStartup, demanda)
    expect(score).toBeGreaterThanOrEqual(70)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('deve retornar 0 se as tags da startup forem nulas', () => {
    const score = calcularCompatibilidadeDemanda(null, {
      segmento: 'Finanças',
      servicos: [],
      tecnologias: [],
    })
    expect(score).toBe(0)
  })
})

describe('oportunidades.ts - listarOportunidades', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar lista vazia de recomendações se não houver demandas no sistema', async () => {
    vi.mocked(demandasLib.buscarDemandasDisponiveis).mockResolvedValueOnce([])

    const tags = {
      area: 'Finanças',
      services: ['Automação'],
      technologies: ['Python'],
      segments: ['Fintech'],
    }

    const resultado = await listarOportunidades('startup-1', tags as any)

    expect(resultado.oportunidades).toEqual([])
    expect(resultado.origem).toBe('api')
  })

  it('deve listar apenas demandas com similaridade real cadastradas por empresas', async () => {
    vi.mocked(demandasLib.buscarDemandasDisponiveis).mockResolvedValueOnce([
      {
        id: 'dem-compativel',
        company_id: 'comp-1',
        empresa_nome: 'AgroTech Brasil',
        titulo: 'Sistema de monitoramento de safra',
        descricao: 'Plataforma para monitoramento de lavouras em tempo real.',
        segmento: 'Agritech',
        servicos: ['Desenvolvimento Web'],
        tecnologias: ['React', 'Python'],
        status: 'aberta',
        created_at: '2026-03-01T10:00:00Z',
      },
      {
        id: 'dem-incompativel',
        company_id: 'comp-2',
        empresa_nome: 'Clínica Sorriso',
        titulo: 'Sistema odontológico',
        descricao: 'Agendamento de consultas.',
        segmento: 'Odontologia',
        servicos: ['Consultoria Médica'],
        tecnologias: ['C#'],
        status: 'aberta',
        created_at: '2026-03-01T10:00:00Z',
      },
    ])

    const tags = {
      area: 'Agritech',
      services: ['Desenvolvimento Web'],
      technologies: ['React'],
      segments: ['Agritech'],
    }

    const resultado = await listarOportunidades('startup-1', tags as any)

    expect(resultado.oportunidades).toHaveLength(1)
    expect(resultado.oportunidades[0].id).toBe('dem-compativel')
    expect(resultado.oportunidades[0].empresa).toBe('AgroTech Brasil')
    expect(resultado.oportunidades[0].compatibilidade).toBeGreaterThan(60)
  })

  it('deve remover demandas já candidatadas ou ignoradas da listagem', async () => {
    vi.mocked(demandasLib.buscarDemandasDisponiveis).mockResolvedValue([
      {
        id: 'dem-100',
        company_id: 'comp-1',
        empresa_nome: 'Empresa Teste',
        titulo: 'Demanda Teste',
        descricao: 'Demanda de teste.',
        segmento: 'Tecnologia',
        servicos: ['Desenvolvimento Web'],
        tecnologias: ['React'],
        status: 'aberta',
        created_at: '2026-03-01T10:00:00Z',
      },
    ])

    const tags = {
      area: 'Tecnologia',
      services: ['Desenvolvimento Web'],
      technologies: ['React'],
      segments: ['Tecnologia'],
    }

    await ignorarOportunidade('dem-100')
    await manifestarInteresse('dem-100')

    const resultado = await listarOportunidades('startup-1', tags as any)
    expect(resultado.oportunidades.find((o) => o.id === 'dem-100')).toBeUndefined()
  })
})
