import CanvasPublico from '@/components/perfil/CanvasPublico.tsx'
import { canvasVazio, carregarCanvas, salvarCanvas, temConteudo } from '@/lib/canvas.ts'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

function instalarStorageEmMemoria() {
  const dados = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => void dados.set(k, v),
    removeItem: (k: string) => void dados.delete(k),
    clear: () => dados.clear(),
  })
}

describe('canvas', () => {
  beforeEach(() => instalarStorageEmMemoria())

  it('retorna canvas vazio quando nada foi salvo', () => {
    expect(carregarCanvas('s1')).toEqual(canvasVazio())
  })

  it('salva e recarrega por startup, aparando espaços', () => {
    const c = { ...canvasVazio(), propostaValor: '  Menos custo  ' }
    salvarCanvas('s1', c)
    expect(carregarCanvas('s1').propostaValor).toBe('Menos custo')
    expect(carregarCanvas('s2').propostaValor).toBe('')
  })

  it('ignora JSON inválido', () => {
    localStorage.setItem('recintech:canvas:s1', '{quebrado')
    expect(carregarCanvas('s1')).toEqual(canvasVazio())
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
