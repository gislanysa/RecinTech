import CanvasPublico from '@/components/perfil/CanvasPublico.tsx'
import { api } from '@/lib/api.ts'
import { canvasVazio, carregarCanvas, salvarCanvas, temConteudo } from '@/lib/canvas.ts'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api.ts', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

describe('canvas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna canvas vazio quando a API não retorna dados', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Not found'))
    const resultado = await carregarCanvas('s1')
    expect(resultado).toEqual(canvasVazio())
    expect(api.get).toHaveBeenCalledWith('/startup/s1/canvas')
  })

  it('salva e recarrega por startup via PUT e GET na API', async () => {
    const c = { ...canvasVazio(), propostaValor: '  Menos custo  ' }
    vi.mocked(api.put).mockResolvedValueOnce({
      data: {
        customer_segments: '',
        value_proposition: 'Menos custo',
        channels: '',
        customer_relationships: '',
        revenue_streams: '',
        key_resources: '',
        key_activities: '',
        key_partnerships: '',
        cost_structure: '',
      },
    })

    const salvo = await salvarCanvas('s1', c)
    expect(api.put).toHaveBeenCalledWith(
      '/startup/s1/canvas',
      expect.objectContaining({ value_proposition: 'Menos custo' }),
    )
    expect(salvo.propostaValor).toBe('Menos custo')
  })

  it('temConteudo só é verdadeiro com algum bloco preenchido', () => {
    expect(temConteudo(canvasVazio())).toBe(false)
    expect(temConteudo({ ...canvasVazio(), canais: 'Site' })).toBe(true)
  })
})

describe('CanvasPublico', () => {
  it('não renderiza nada com canvas vazio', () => {
    const { container } = render(<CanvasPublico canvas={canvasVazio()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('mostra os blocos preenchidos e marca os vazios', () => {
    render(<CanvasPublico canvas={{ ...canvasVazio(), propostaValor: 'Menos custo' }} />)
    expect(screen.getByText('Menos custo')).toBeInTheDocument()
    expect(screen.getByText('Proposta de valor')).toBeInTheDocument()
    expect(screen.getAllByText('Não informado')).toHaveLength(8)
  })
})
