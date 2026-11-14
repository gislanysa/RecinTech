import {
  buscarExpertises,
  buscarSegmentos,
  buscarServicos,
  buscarTecnologias,
  carregarTagsDetalhadasStartup,
  salvarTagsStartup,
} from '@/lib/catalogos.ts'
import * as apiModule from '@/lib/api.ts'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api.ts', () => ({
  api: {
    get: vi.fn(),
  },
  associarExpertiseStartup: vi.fn(),
  desassociarExpertiseStartup: vi.fn(),
  associarServicoStartup: vi.fn(),
  desassociarServicoStartup: vi.fn(),
  associarTecnologiaStartup: vi.fn(),
  desassociarTecnologiaStartup: vi.fn(),
  associarSegmentoStartup: vi.fn(),
  desassociarSegmentoStartup: vi.fn(),
}))

describe('catalogos.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buscarSegmentos, buscarServicos, buscarTecnologias, buscarExpertises', () => {
    it('deve retornar dados da API quando a requisição for bem-sucedida', async () => {
      const mockSegmentos = [{ id: '1', name: 'Agronegócio', description: 'Agro' }]
      vi.mocked(apiModule.api.get).mockResolvedValueOnce({ data: mockSegmentos })

      const resultado = await buscarSegmentos()
      expect(resultado).toEqual(mockSegmentos)
      expect(apiModule.api.get).toHaveBeenCalledWith('/segment', {
        params: { limit: 100, offset: 0 },
      })
    })

    it('deve retornar fallback estático se a API falhar', async () => {
      vi.mocked(apiModule.api.get).mockRejectedValueOnce(new Error('Erro de rede'))

      const resultado = await buscarSegmentos()
      expect(resultado.length).toBeGreaterThan(0)
      expect(resultado[0]).toHaveProperty('id')
      expect(resultado[0]).toHaveProperty('name')
    })

    it('deve buscar serviços com sucesso ou fallback', async () => {
      vi.mocked(apiModule.api.get).mockRejectedValueOnce(new Error('Erro'))
      const servicos = await buscarServicos()
      expect(servicos.length).toBeGreaterThan(0)
    })

    it('deve buscar tecnologias com sucesso ou fallback', async () => {
      vi.mocked(apiModule.api.get).mockRejectedValueOnce(new Error('Erro'))
      const tecs = await buscarTecnologias()
      expect(tecs.length).toBeGreaterThan(0)
    })

    it('deve buscar expertises com sucesso ou fallback', async () => {
      vi.mocked(apiModule.api.get).mockRejectedValueOnce(new Error('Erro'))
      const exps = await buscarExpertises()
      expect(exps.length).toBeGreaterThan(0)
    })
  })

  describe('carregarTagsDetalhadasStartup', () => {
    it('deve retornar objeto com as tags detalhadas da startup', async () => {
      vi.mocked(apiModule.api.get)
        .mockResolvedValueOnce({ data: [{ id: 'exp-1', name: 'Área 1', description: '' }] })
        .mockResolvedValueOnce({ data: [{ id: 'srv-1', name: 'Serviço 1', description: '' }] })
        .mockResolvedValueOnce({ data: [{ id: 'tec-1', name: 'Tec 1', description: '' }] })
        .mockResolvedValueOnce({ data: [{ id: 'seg-1', name: 'Seg 1', description: '' }] })

      const tags = await carregarTagsDetalhadasStartup('startup-1')

      expect(tags.expertises).toHaveLength(1)
      expect(tags.services).toHaveLength(1)
      expect(tags.technologies).toHaveLength(1)
      expect(tags.segments).toHaveLength(1)
      expect(tags.expertises[0].name).toBe('Área 1')
    })
  })

  describe('salvarTagsStartup', () => {
    it('deve calcular corretamente inserções e remoções de cada catálogo', async () => {
      const startupId = 'startup-42'
      const atuais = {
        expertises: ['exp-1'],
        services: ['srv-1', 'srv-2'],
        technologies: [],
        segments: ['seg-1'],
      }
      const novos = {
        expertises: ['exp-1', 'exp-2'], // adicionar exp-2
        services: ['srv-1'], // remover srv-2
        technologies: ['tec-1'], // adicionar tec-1
        segments: [], // remover seg-1
      }

      await salvarTagsStartup(startupId, novos, atuais)

      expect(apiModule.associarExpertiseStartup).toHaveBeenCalledWith(startupId, 'exp-2')
      expect(apiModule.desassociarExpertiseStartup).not.toHaveBeenCalled()

      expect(apiModule.desassociarServicoStartup).toHaveBeenCalledWith(startupId, 'srv-2')
      expect(apiModule.associarServicoStartup).not.toHaveBeenCalled()

      expect(apiModule.associarTecnologiaStartup).toHaveBeenCalledWith(startupId, 'tec-1')
      expect(apiModule.desassociarTecnologiaStartup).not.toHaveBeenCalled()

      expect(apiModule.desassociarSegmentoStartup).toHaveBeenCalledWith(startupId, 'seg-1')
      expect(apiModule.associarSegmentoStartup).not.toHaveBeenCalled()
    })
  })
})
