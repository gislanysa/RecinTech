import { AuthProvider } from '@/contexts/AuthContext.tsx'
import PaginaNaoEncontrada from '@/pages/PaginaNaoEncontrada.tsx'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

describe('Página 404 - PaginaNaoEncontrada', () => {
  it('deve renderizar o título 404, mensagem e botão para voltar ao início', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <PaginaNaoEncontrada />
        </AuthProvider>
      </MemoryRouter>,
    )

    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1, name: /página não encontrada/i })).toBeInTheDocument()
    expect(within(main).getByText('ERRO 404')).toBeInTheDocument()
    expect(
      within(main).getByText(/o endereço que você tentou acessar não existe/i),
    ).toBeInTheDocument()

    const linkInicio = within(main).getByRole('link', { name: /voltar para o início/i })
    expect(linkInicio).toHaveAttribute('href', '/')

    const linkExplorar = within(main).getByRole('link', { name: /explorar startups/i })
    expect(linkExplorar).toHaveAttribute('href', '/startups')
  })
})
