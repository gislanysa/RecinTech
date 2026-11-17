import MeuPerfilStartup from '@/pages/MeuPerfilStartup.tsx'
import * as canvasLib from '@/lib/canvas.ts'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockStartup = {
  id: 'startup-1',
  name: 'Minha Startup',
  email: 'contato@startup.com',
  stage: 'traction' as const,
  city: 'Recife',
  state: 'PE',
  cnpj: '12345678000199',
  website: 'https://startup.com',
  description: 'Solução inovadora',
  created_at: '2026-01-01',
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useOutletContext: () => ({ conta: mockStartup, aoAtualizarConta: vi.fn() }),
  }
})

vi.mock('@/lib/startups.ts', async () => {
  const actual = await vi.importActual<typeof import('@/lib/startups.ts')>('@/lib/startups.ts')
  return {
    ...actual,
    carregarTagsDaStartup: vi.fn().mockResolvedValue({
      area: 'Tecnologia',
      services: ['Consultoria'],
      technologies: ['React'],
      segments: ['B2B'],
    }),
  }
})

let dadosMockCanvas = canvasLib.canvasVazio()

vi.mock('@/lib/canvas.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/canvas.ts')>()
  return {
    ...actual,
    carregarCanvas: vi.fn(async () => dadosMockCanvas),
    salvarCanvas: vi.fn(async (_id: string, c: any) => {
      dadosMockCanvas = { ...c }
      return dadosMockCanvas
    }),
  }
})

function renderPerfil() {
  return render(
    <MemoryRouter>
      <MeuPerfilStartup />
    </MemoryRouter>,
  )
}

describe('MeuPerfilStartup - Business Model Canvas', () => {
  beforeEach(() => {
    dadosMockCanvas = canvasLib.canvasVazio()
    vi.clearAllMocks()
  })

  it('exibe estado inicial vazio e botão para preencher canvas', async () => {
    renderPerfil()
    expect(screen.getByRole('heading', { name: 'Business Model Canvas' })).toBeInTheDocument()
    expect(await screen.findByText('Você ainda não preencheu o seu Business Model Canvas.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Preencher canvas' })).toBeInTheDocument()
  })

  it('permite preencher e salvar o canvas na própria tela de perfil', async () => {
    renderPerfil()

    fireEvent.click(await screen.findByRole('button', { name: 'Preencher canvas' }))

    const campoProposta = screen.getByLabelText('Proposta de valor')
    fireEvent.change(campoProposta, { target: { value: 'Redução de custos operacionais com IA' } })

    fireEvent.click(screen.getByRole('button', { name: 'Salvar canvas' }))

    expect(await screen.findByText('Business Model Canvas salvo com sucesso!')).toBeInTheDocument()
    expect(screen.getByText('Redução de custos operacionais com IA')).toBeInTheDocument()
    expect(canvasLib.salvarCanvas).toHaveBeenCalledWith(
      'startup-1',
      expect.objectContaining({ propostaValor: 'Redução de custos operacionais com IA' }),
    )
  })

  it('permite cancelar a edição mantendo os dados salvos', async () => {
    dadosMockCanvas = {
      ...canvasLib.canvasVazio(),
      propostaValor: 'Valor original',
    }

    renderPerfil()
    expect(await screen.findByText('Valor original')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Editar canvas' }))
    const campoProposta = screen.getByLabelText('Proposta de valor')
    fireEvent.change(campoProposta, { target: { value: 'Valor modificado não salvo' } })

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(await screen.findByText('Valor original')).toBeInTheDocument()
    expect(screen.queryByText('Valor modificado não salvo')).not.toBeInTheDocument()
  })
})
