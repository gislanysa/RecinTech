import {
  api,
  aoExpirarSessao,
  renovarSessao,
  restaurarSessao,
  type ContaLogada,
} from '@/lib/api.ts'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('api.ts - Sessão, interceptor de 401 e resiliência de rede', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('restaurarSessao', () => {
    it('deve retornar ContaLogada quando /auth/restore responder 200', async () => {
      const contaMock: ContaLogada = {
        id: '123',
        name: 'Startup Teste',
        email: 'teste@startup.com',
        cnpj: '12345678000190',
        stage: 'traction',
        description: '',
        city: 'Recife',
        state: 'PE',
        website: '',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
      }

      vi.spyOn(api, 'get').mockResolvedValueOnce({ data: contaMock })

      const resultado = await restaurarSessao()
      expect(resultado).toEqual(contaMock)
    })

    it('deve retornar null SOMENTE quando a resposta for 401 (não autenticado)', async () => {
      const erro401 = new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 401,
        statusText: 'Unauthorized',
        data: 'Unauthorized',
        headers: {},
        config: {} as any,
      })

      vi.spyOn(api, 'get').mockRejectedValueOnce(erro401)

      const resultado = await restaurarSessao()
      expect(resultado).toBeNull()
    })

    it('deve relançar o erro em caso de erro de rede para não deslogar o usuário', async () => {
      const erroRede = new axios.AxiosError('Network Error', 'ERR_NETWORK')
      vi.spyOn(api, 'get').mockRejectedValueOnce(erroRede)

      await expect(restaurarSessao()).rejects.toThrow('Network Error')
    })

    it('deve relançar o erro em caso de erro 500 do servidor', async () => {
      const erro500 = new axios.AxiosError('Server Error', 'ERR_BAD_RESPONSE', undefined, undefined, {
        status: 500,
        statusText: 'Internal Server Error',
        data: 'Internal error',
        headers: {},
        config: {} as any,
      })

      vi.spyOn(api, 'get').mockRejectedValueOnce(erro500)

      await expect(restaurarSessao()).rejects.toThrow('Server Error')
    })
  })

  describe('renovarSessao', () => {
    it('deve chamar /auth/refresh e retornar true quando status for 204', async () => {
      const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({ status: 204, data: null })

      const sucesso = await renovarSessao()

      expect(spy).toHaveBeenCalledWith('/auth/refresh')
      expect(sucesso).toBe(true)
    })

    it('deve retornar false quando /auth/refresh falhar', async () => {
      vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Expired'))

      const sucesso = await renovarSessao()
      expect(sucesso).toBe(false)
    })
  })

  describe('aoExpirarSessao (interceptor)', () => {
    it('deve permitir registrar e desinscrever callback de sessão expirada', () => {
      const callback = vi.fn()
      const desinscrever = aoExpirarSessao(callback)

      expect(typeof desinscrever).toBe('function')
      desinscrever()
    })
  })
})
