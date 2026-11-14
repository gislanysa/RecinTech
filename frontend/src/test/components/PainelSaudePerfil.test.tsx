import PainelSaudePerfil from '@/components/dashboard-startup/PainelSaudePerfil.tsx'
import type { Startup } from '@/lib/api.ts'
import { canvasVazio, salvarCanvas } from '@/lib/canvas.ts'
import type { Tags } from '@/lib/perfil.ts'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const startupMock: Startup = {
  id: 'startup-1',
  name: 'BioTech Solutions',
  email: 'contato@biotech.com',
  stage: 'traction',
  cnpj: '12345678000199',
  description: '',
  city: 'Recife',
  state: 'PE',
  website: '',
  is_active: true,
  created_at: new Date().toISOString(),
}

const tagsVazias: Tags = {
  area: '',
  services: [],
  technologies: [],
  segments: [],
}

const tagsCompletas: Tags = {
  area: 'Tecnologia',
  services: ['Desenvolvimento Web'],
  technologies: ['React'],
  segments: ['Saas / Software'],
}

function instalarStorageEmMemoria() {
  const dados = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => void dados.set(k, v),
    removeItem: (k: string) => void dados.delete(k),
    clear: () => dados.clear(),
  })
}

describe('PainelSaudePerfil', () => {
  beforeEach(() => {
    instalarStorageEmMemoria()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('deve exibir a tag cinza com a quantidade de pendências quando houver itens faltando', () => {
    render(
      <MemoryRouter>
        <PainelSaudePerfil startup={startupMock} tags={tagsVazias} />
      </MemoryRouter>,
    )

    // Tag de pendências visível com cor cinza claro
    const tag = screen.getByText(/pendências/i)
    expect(tag).toBeInTheDocument()
    expect(tag).toHaveClass('bg-gray-100', 'text-gray-700')
    expect(tag).toHaveTextContent('7 pendências')

    // Botão para ver o perfil
    const btnPerfil = screen.getByRole('link', { name: /ver meu perfil/i })
    expect(btnPerfil).toBeInTheDocument()
    expect(btnPerfil).toHaveAttribute('href', '/dashboard/startup/perfil')
  })

  it('não deve exibir a tag de pendências quando o perfil estiver 100% completo', () => {
    salvarCanvas(startupMock.id, {
      ...canvasVazio(),
      propostaValor: 'Plataforma líder',
    })

    const startupCompleta: Startup = {
      ...startupMock,
      description: 'Startup completa',
      website: 'https://biotech.com',
    }

    render(
      <MemoryRouter>
        <PainelSaudePerfil startup={startupCompleta} tags={tagsCompletas} />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Seu perfil está completo/i)).toBeInTheDocument()
    expect(screen.queryByText(/pendências|pendência/i)).not.toBeInTheDocument()
  })
})
