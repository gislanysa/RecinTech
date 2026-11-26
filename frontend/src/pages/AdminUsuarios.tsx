import Botao from '@/components/Botao.tsx'
import { Campo } from '@/components/forms/Campo.tsx'
import { CheckIcon, CloseIcon, UsersIcon } from '@/components/icons.tsx'
import {
  adicionarAdmin,
  alternarStatusAdmin,
  obterAdmins,
  type Admin,
} from '@/lib/admin.ts'
import { useEffect, useState } from 'react'

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

export default function AdminUsuarios() {
  const [admins, setAdmins] = useState<Admin[]>(() => obterAdmins())
  const [modalNovoAdmin, setModalNovoAdmin] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [cargo, setCargo] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    function atualizar() {
      setAdmins(obterAdmins())
    }
    window.addEventListener('storage', atualizar)
    return () => window.removeEventListener('storage', atualizar)
  }, [])

  function handleCriarAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !email.trim()) {
      setErro('Informe nome e e-mail para o novo administrador.')
      return
    }

    try {
      adicionarAdmin({ name: nome.trim(), email: email.trim(), cargo: cargo.trim() })
      setAdmins(obterAdmins())
      setModalNovoAdmin(false)
      setNome('')
      setEmail('')
      setCargo('')
      setErro('')
      setSucesso('Novo administrador cadastrado com sucesso!')
      setTimeout(() => setSucesso(''), 4000)
    } catch (err) {
      if (err instanceof Error) {
        setErro(err.message)
      } else {
        setErro('Erro ao cadastrar administrador.')
      }
    }
  }

  function handleToggleStatus(id: string) {
    try {
      alternarStatusAdmin(id)
      setAdmins(obterAdmins())
      setSucesso('Status do administrador atualizado.')
      setTimeout(() => setSucesso(''), 3000)
    } catch (err) {
      if (err instanceof Error) {
        setErro(err.message)
        setTimeout(() => setErro(''), 4000)
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Gestão de Administradores
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Controle de papéis administrativos, atribuições e permissões de acesso ao painel de governança.
          </p>
        </div>

        <Botao onClick={() => setModalNovoAdmin(true)}>
          + Novo Administrador
        </Botao>
      </header>

      {sucesso && (
        <div className="flex items-center gap-2 rounded-xl border border-accent-300 bg-accent-100 p-3.5 text-xs font-medium text-ink-900">
          <CheckIcon className="size-4 text-accent-700" />
          {sucesso}
        </div>
      )}

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700">
          {erro}
        </div>
      )}

      {/* Tabela de Administradores */}
      <div className="overflow-x-auto rounded-card border border-brand-100 bg-surface shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-brand-100 bg-brand-50/70 text-ink-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-semibold">Administrador</th>
              <th className="px-4 py-3 font-semibold">E-mail de Acesso</th>
              <th className="px-4 py-3 font-semibold">Cargo / Função</th>
              <th className="px-4 py-3 font-semibold">Data Cadastro</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {admins.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-brand-50/40">
                <td className="px-4 py-3 font-medium text-ink-900">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-brand-100 text-brand-800">
                      <UsersIcon className="size-3.5" />
                    </div>
                    <span>{a.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-700">{a.email}</td>
                <td className="px-4 py-3 text-ink-700">{a.cargo || 'Gestão da Plataforma'}</td>
                <td className="px-4 py-3 text-ink-700">{formatarData(a.created_at)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      a.is_active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {a.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {a.id !== 'admin-master' ? (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(a.id)}
                      className={`rounded-lg px-2 py-1 text-[11px] font-medium ${
                        a.is_active
                          ? 'border border-red-200 text-red-600 hover:bg-red-50'
                          : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {a.is_active ? 'Desativar' : 'Reativar'}
                    </button>
                  ) : (
                    <span className="text-[11px] italic text-ink-400">Master</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Administrador */}
      {modalNovoAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-brand-100 bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-100 pb-4">
              <h2 className="font-display text-lg font-bold text-ink-900">
                Cadastrar Administrador
              </h2>
              <button
                type="button"
                onClick={() => setModalNovoAdmin(false)}
                className="rounded-lg p-1 text-ink-500 hover:bg-brand-50"
                aria-label="Fechar"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCriarAdmin} className="mt-5 space-y-4">
              {erro && (
                <p className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
                  {erro}
                </p>
              )}

              <Campo
                id="novo-admin-nome"
                label="Nome completo"
                required
                value={nome}
                onChange={setNome}
                placeholder="Ex.: Mariana Silva"
              />

              <Campo
                id="novo-admin-email"
                label="E-mail de acesso"
                type="email"
                required
                value={email}
                onChange={setEmail}
                placeholder="Ex.: mariana@recintech.com"
              />

              <Campo
                id="novo-admin-cargo"
                label="Cargo / Função"
                value={cargo}
                onChange={setCargo}
                placeholder="Ex.: Operações e Parcerias B2B"
              />

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalNovoAdmin(false)}
                  className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-brand-50"
                >
                  Cancelar
                </button>
                <Botao type="submit">Cadastrar Administrador</Botao>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
