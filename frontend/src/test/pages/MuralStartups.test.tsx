import MuralStartups from '@/pages/MuralStartups.tsx'
import * as startups from '@/lib/startups.ts'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/startups.ts', async () => {
  const actual = await vi.importActual<typeof import('@/lib/startups.ts')>('@/lib/startups.ts')
  return { ...actual, listarStartups: vi.fn() }
})

function nova(id: string, name: string, area: string): startups.StartupCatalogo {
  return {
    id,
    slug: id,
    name,
    email: `${id}@x.com`,
    initials: name.slice(0, 2).toUpperCase(),
    area,
    tagline: `Tagline ${name}`,
    description: '',
    stage: 'traction',
    cnpj: '',
    services: ['Consultoria'],
    technologies: ['React'],
    segments: [],
    city: 'Recife',
    state: 'PE',
    remote: true,
    onsite: false,
    website: '',
    is_active: true,
    created_at: '2026-01-01',
    relevance: 1,
  }
}

function renderMural() {
  return render(
    <MemoryRouter initialEntries={['/mural']}>
      <Routes>
        <Route path="/mural" element={<MuralStartups />} />
      </Routes>
    </MemoryRouter>,
  )
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useOutletContext: () => ({ conta: { id: 'eu' } }) }
})

describe('MuralStartups', () => {
  beforeEach(() => {
    vi.mocked(startups.listarStartups).mockResolvedValue([
      nova('eu', 'Minha Startup', 'Tecnologia'),
      nova('a', 'Alfa', 'Saúde'),
      nova('b', 'Beta', 'Tecnologia'),
    ])
  })

  it('lista as outras startups, sem a própria, e filtra por área', async () => {
    renderMural()
    await waitFor(() => expect(screen.getByText('Alfa')).toBeInTheDocument())
    expect(screen.queryByText('Minha Startup')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Saúde' }))
    expect(screen.getByText('Alfa')).toBeInTheDocument()
    expect(screen.queryByText('Beta')).not.toBeInTheDocument()
  })

  it('abre o perfil ao clicar no cartão', async () => {
    renderMural()
    await waitFor(() => expect(screen.getByText('Alfa')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Ver perfil de Alfa/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
