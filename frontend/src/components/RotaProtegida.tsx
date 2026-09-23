import { restaurarSessao } from '@/lib/api.ts'
import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

/**
 * Wrapper de rota protegida.
 *
 * Ao montar, faz GET /auth/restore para validar o cookie de sessão.
 * - Cookie válido → renderiza a rota filha (Outlet)
 * - Cookie expirado/ausente → redireciona para /entrar
 */
export default function RotaProtegida() {
  const [estado, setEstado] = useState<'carregando' | 'autenticado' | 'nao-autenticado'>('carregando')

  useEffect(() => {
    restaurarSessao().then((usuario) => {
      setEstado(usuario ? 'autenticado' : 'nao-autenticado')
    })
  }, [])

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

  return <Outlet />
}
