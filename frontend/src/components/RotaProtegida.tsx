import { useAuth } from '@/contexts/useAuth.ts'
import type { ContaLogada, TipoSessao } from '@/lib/api.ts'
import { Navigate, Outlet } from 'react-router-dom'

/** Contexto entregue às rotas filhas via `useOutletContext<ContextoSessao>()`. */
export type ContextoSessao = { conta: ContaLogada }

type RotaProtegidaProps = {
  /** Se informado, apenas contas deste tipo acessam a rota. */
  tipo?: TipoSessao
}

/**
 * Wrapper de rota protegida.
 *
 * Consome o AuthContext global para validar o estado da sessão:
 * - Carregando → exibe tela de carregamento centralizada
 * - Não autenticado → redireciona para /entrar
 * - Autenticado com tipo correto → renderiza a rota filha (Outlet)
 */
export default function RotaProtegida({ tipo }: RotaProtegidaProps) {
  const { conta, tipoConta, estado } = useAuth()

  if (estado === 'carregando') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <svg className="size-6 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm text-ink-500">Verificando sessão…</p>
        </div>
      </div>
    )
  }

  if (estado === 'nao-autenticado') {
    return <Navigate to="/entrar" replace />
  }

  // Conta logada do tipo errado: manda para o dashboard correto.
  if (tipo && tipoConta !== tipo) {
    const destino = tipoConta === 'company' ? '/dashboard/empresa' : '/dashboard/startup'
    return <Navigate to={destino} replace />
  }

  return <Outlet context={{ conta } satisfies { conta: ContaLogada | null }} />
}
