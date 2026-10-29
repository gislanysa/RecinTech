import LayoutDashboardBase, {
  type ItemNavegacaoDashboard,
} from '@/components/layout/LayoutDashboardBase.tsx'
import { HomeIcon, TargetIcon } from '@/components/icons.tsx'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockLogout = vi.fn()

vi.mock('@/contexts/useAuth.ts', () => ({
  useAuth: () => ({
    logout: mockLogout,
  }),
}))

describe('LayoutDashboardBase component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const itensMock: ItemNavegacaoDashboard[] = [
    { rotulo: 'Início', to: '/dashboard/teste', Icone: HomeIcon, exato: true },
    { rotulo: 'Demandas', to: '/dashboard/teste/demandas', Icone: TargetIcon },
  ]

  function renderLayout(props?: Partial<React.ComponentProps<typeof LayoutDashboardBase>>) {
    return render(
      <MemoryRouter initialEntries={['/dashboard/teste']}>
        <Routes>
          <Route
            element={
              <LayoutDashboardBase
                nomeUsuario="Empresa Solar PE"
                subtituloConta="Conta empresarial"
                badgePerfil={{ rotulo: 'Empresa', classe: 'bg-accent-50 text-accent-700' }}
                itensNavegacao={itensMock}
                idPrefixo="empresa"
                redirecionarAposLogout="/entrar"
                {...props}
              />
            }
          >
            <Route path="/dashboard/teste" element={<div>Conteúdo da Página</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
  }

  it('deve renderizar o nome do usuário, subtítulo, badge e itens de navegação', () => {
    renderLayout()

    expect(screen.getAllByText('Empresa Solar PE')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Conta empresarial')[0]).toBeInTheDocument()
    expect(screen.getByText('Empresa')).toBeInTheDocument()
    expect(screen.getAllByText('Início')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Demandas')[0]).toBeInTheDocument()
    expect(screen.getByText('Conteúdo da Página')).toBeInTheDocument()
  })

  it('deve alternar a abertura do menu mobile e fechar ao teclar Escape', () => {
    renderLayout()

    const btnAbrir = screen.getByRole('button', { name: /abrir menu/i })
    expect(btnAbrir).toHaveAttribute('aria-expanded', 'false')

    // Abre o menu
    fireEvent.click(btnAbrir)
    expect(btnAbrir).toHaveAttribute('aria-expanded', 'true')

    // Pressiona Escape para fechar
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(btnAbrir).toHaveAttribute('aria-expanded', 'false')
  })

  it('deve chamar logout e navegar ao clicar no botão de Sair', async () => {
    mockLogout.mockResolvedValueOnce(undefined)
    renderLayout()

    const btnSair = screen.getAllByRole('button', { name: /sair/i })[0]
    await act(async () => {
      fireEvent.click(btnSair)
    })

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })
})
