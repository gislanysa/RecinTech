import Botao from '@/components/Botao.tsx'
import { Campo } from '@/components/forms/Campo.tsx'
import { CheckIcon, CloseIcon } from '@/components/icons.tsx'
import { useAuth } from '@/contexts/useAuth.ts'
import {
  atualizarAdmin,
  type Admin,
} from '@/lib/admin.ts'
import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'

function formatarData(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

export default function MeuPerfilAdmin() {
  const contexto = useOutletContext<ContextoSessao>()
  const adminInicial = contexto.conta as Admin
  const { definirConta } = useAuth()

  const [dadosAdmin, setDadosAdmin] = useState<Admin>(adminInicial)
  const [modalAberto, setModalAberto] = useState(false)
  const [nome, setNome] = useState(dadosAdmin?.name || '')
  const [cargo, setCargo] = useState(dadosAdmin?.cargo || '')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  function abrirEdicao() {
    setNome(dadosAdmin.name)
    setCargo(dadosAdmin.cargo || '')
    setErro('')
    setModalAberto(true)
  }

  function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setErro('O nome do administrador é obrigatório.')
      return
    }

    try {
      const atualizado = atualizarAdmin(dadosAdmin.id, {
        name: nome.trim(),
        cargo: cargo.trim(),
      })
      setDadosAdmin(atualizado)
      if (typeof definirConta === 'function') {
        definirConta(atualizado)
      }
      setModalAberto(false)
      setSucesso('Perfil de administrador atualizado com sucesso!')
      setTimeout(() => setSucesso(''), 4000)
    } catch {
      setErro('Não foi possível atualizar o perfil.')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Meu Perfil de Administrador
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Credenciais e informações do seu usuário com permissões administrativas na plataforma.
        </p>
      </header>

      {sucesso && (
        <div className="flex items-center gap-2 rounded-xl border border-accent-300 bg-accent-100 p-4 text-sm font-medium text-ink-900">
          <CheckIcon className="size-5 text-accent-700" />
          {sucesso}
        </div>
      )}

      <section className="rounded-card bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Dados do Administrador</h2>
            <p className="text-xs text-ink-500">
              Acesso total às rotas de governança, moderação de empresas e startups
            </p>
          </div>
          <Botao onClick={abrirEdicao}>Editar perfil</Botao>
        </div>

        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Nome</dt>
            <dd className="mt-1 text-sm font-medium text-ink-900">{dadosAdmin?.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Função / Atribuição</dt>
            <dd className="mt-1 text-sm text-ink-900">{dadosAdmin?.cargo || 'Governança da Plataforma'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">E-mail de Acesso</dt>
            <dd className="mt-1 text-sm text-ink-900">{dadosAdmin?.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Papel no Sistema</dt>
            <dd className="mt-1 text-sm font-semibold text-brand-700">
              Administrador (Acesso Total)
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Status da Conta</dt>
            <dd className="mt-1 text-sm text-emerald-700">
              {dadosAdmin?.is_active ? 'Conta Ativa' : 'Inativa'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">Data de Criação</dt>
            <dd className="mt-1 text-sm text-ink-900">
              {formatarData(dadosAdmin?.created_at)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Modal Edição Perfil Admin */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-brand-100 bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-100 pb-4">
              <h2 className="font-display text-lg font-bold text-ink-900">
                Editar Perfil de Administrador
              </h2>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="rounded-lg p-1 text-ink-500 hover:bg-brand-50"
                aria-label="Fechar"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="mt-5 space-y-4">
              {erro && (
                <p className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
                  {erro}
                </p>
              )}

              <Campo
                id="edit-admin-nome"
                label="Nome completo"
                required
                value={nome}
                onChange={setNome}
              />

              <Campo
                id="edit-admin-cargo"
                label="Cargo / Função"
                value={cargo}
                onChange={setCargo}
              />

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-brand-50"
                >
                  Cancelar
                </button>
                <Botao type="submit">Salvar alterações</Botao>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
