import PainelSaudePerfil from '@/components/dashboard-startup/PainelSaudePerfil.tsx'
import type { Startup } from '@/lib/api.ts'
import type { Tags } from '@/lib/perfil.ts'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

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

describe('PainelSaudePerfil', () => {
  it('não deve mostrar os passos que faltam logo de cara', () => {
    render(
      <MemoryRouter>
        <PainelSaudePerfil startup={startupMock} tags={tagsVazias} />
      </MemoryRouter>,
    )

    // O cabeçalho "Próximos passos" existe
    expect(screen.getByText('Próximos passos')).toBeInTheDocument()

    // O botão de toggle existe e indica que está fechado
    const btnToggle = screen.getByRole('button', { name: /próximos passos/i })
    expect(btnToggle).toHaveAttribute('aria-expanded', 'false')

    // A lista com os passos pendentes NÃO deve estar no documento logo de cara
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('deve expandir e mostrar os passos pendentes quando o usuário clicar em Próximos passos', () => {
    render(
      <MemoryRouter>
        <PainelSaudePerfil startup={startupMock} tags={tagsVazias} />
      </MemoryRouter>,
    )

    const btnToggle = screen.getByRole('button', { name: /próximos passos/i })
    fireEvent.click(btnToggle)

    expect(btnToggle).toHaveAttribute('aria-expanded', 'true')

    // Agora a lista deve estar no documento
    const lista = screen.getByRole('list')
    expect(lista).toBeInTheDocument()

    // Clicar novamente deve ocultar a lista
    fireEvent.click(btnToggle)
    expect(btnToggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('não deve exibir botão de próximos passos quando o perfil estiver 100% completo', () => {
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
    expect(screen.queryByRole('button', { name: /próximos passos/i })).not.toBeInTheDocument()
  })
})
