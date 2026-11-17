import { CloseIcon, CheckIcon } from '@/components/icons.tsx'
import {
  listarCandidaturasDemanda,
  responderCandidaturaDemanda,
  type CandidaturaDemanda,
  type Demanda,
} from '@/lib/demandas.ts'
import { buscarStartupPorId } from '@/lib/startups.ts'
import { useEffect, useState } from 'react'

type ModalCandidaturasDemandaProps = {
  aberto: boolean
  demanda: Demanda | null
  aoFechar: () => void
}

export default function ModalCandidaturasDemanda({
  aberto,
  demanda,
  aoFechar,
}: ModalCandidaturasDemandaProps) {
  const [candidaturas, setCandidaturas] = useState<CandidaturaDemanda[]>([])
  const [carregando, setCarregando] = useState(false)
  const [respondendo, setRespondendo] = useState<Record<string, boolean>>({})
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!aberto || !demanda?.id) return

    let ativo = true
    queueMicrotask(() => {
      if (ativo) {
        setCarregando(true)
        setErro(null)
      }
    })

    listarCandidaturasDemanda(demanda.id)
      .then(async (lista) => {
        if (!ativo) return

        // Enriquece os dados das candidaturas buscando detalhes de cada startup
        const enriquecidas = await Promise.all(
          lista.map(async (item) => {
            try {
              const startup = await buscarStartupPorId(item.startup)
              return {
                ...item,
                startup_nome: startup.name,
                startup_descricao: startup.description,
                startup_cidade: startup.city,
                startup_estado: startup.state,
              }
            } catch {
              return {
                ...item,
                startup_nome: `Startup ${item.startup.slice(0, 8)}...`,
              }
            }
          }),
        )

        if (ativo) {
          setCandidaturas(enriquecidas)
          setCarregando(false)
        }
      })
      .catch(() => {
        if (ativo) {
          setErro('Não foi possível carregar as candidaturas para esta demanda.')
          setCarregando(false)
        }
      })

    return () => {
      ativo = false
    }
  }, [aberto, demanda?.id])

  if (!aberto || !demanda) return null

  async function handleResponder(startupId: string, status: 'accepted' | 'declined') {
    if (!demanda?.id) return
    setRespondendo((prev) => ({ ...prev, [startupId]: true }))

    try {
      const atualizada = await responderCandidaturaDemanda(demanda.id, startupId, status)
      setCandidaturas((prev) =>
        prev.map((c) => (c.startup === startupId ? { ...c, status: atualizada.status } : c)),
      )
    } catch {
      setErro('Erro ao atualizar a candidatura. Tente novamente.')
    } finally {
      setRespondendo((prev) => ({ ...prev, [startupId]: false }))
    }
  }

  function badgeStatus(status: CandidaturaDemanda['status']) {
    switch (status) {
      case 'accepted':
        return {
          texto: 'Aceita',
          classe: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        }
      case 'declined':
        return {
          texto: 'Recusada',
          classe: 'bg-rose-50 text-rose-700 ring-rose-200',
        }
      case 'pending':
      default:
        return {
          texto: 'Pendente',
          classe: 'bg-amber-50 text-amber-700 ring-amber-200',
        }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-candidaturas-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={aoFechar}
        className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm transition-opacity"
      />

      {/* Conteúdo */}
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-surface p-6 shadow-2xl ring-1 ring-brand-100 sm:p-8">
        <div className="flex items-start justify-between border-b border-brand-100 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">
              Candidaturas Recebidas
            </span>
            <h2 id="modal-candidaturas-titulo" className="mt-1 font-display text-xl font-bold text-ink-900 sm:text-2xl">
              {demanda.titulo}
            </h2>
            <p className="mt-1 text-xs text-ink-500 sm:text-sm">
              Startups que se candidataram a esta demanda aberta.
            </p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar modal"
            className="grid size-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-brand-50 hover:text-ink-900"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-5 pr-1">
          {carregando && (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse rounded-xl bg-brand-50 p-4">
                  <div className="h-4 w-32 rounded bg-brand-200" />
                  <div className="mt-2 h-3 w-48 rounded bg-brand-100" />
                </div>
              ))}
            </div>
          )}

          {!carregando && erro && (
            <div className="rounded-xl border border-dashed border-red-200 bg-red-50/50 p-4 text-center">
              <p className="text-sm font-medium text-red-700">{erro}</p>
            </div>
          )}

          {!carregando && !erro && candidaturas.length === 0 && (
            <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-8 text-center">
              <h3 className="text-base font-semibold text-ink-900">
                Nenhuma startup candidatada ainda
              </h3>
              <p className="mt-1 text-xs text-ink-500 sm:text-sm">
                Quando uma startup visualizar esta demanda aberta e submeter sua candidatura, ela aparecerá aqui para sua avaliação.
              </p>
            </div>
          )}

          {!carregando && !erro && candidaturas.length > 0 && (
            <ul className="flex flex-col gap-3">
              {candidaturas.map((c) => {
                const statusInfo = badgeStatus(c.status)
                const ocupado = !!respondendo[c.startup]

                return (
                  <li
                    key={c.startup}
                    className="flex flex-col gap-3 rounded-xl border border-brand-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-base font-bold text-ink-900">
                          {c.startup_nome}
                        </h4>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${statusInfo.classe}`}
                        >
                          {statusInfo.texto}
                        </span>
                      </div>
                      {c.startup_cidade && c.startup_estado && (
                        <p className="mt-0.5 text-xs text-ink-500">
                          {c.startup_cidade}, {c.startup_estado}
                        </p>
                      )}
                      {c.startup_descricao && (
                        <p className="mt-1 line-clamp-2 text-xs text-ink-700">
                          {c.startup_descricao}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-ink-500/80">
                        Candidatura enviada em {new Date(c.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
                      <button
                        type="button"
                        disabled={ocupado || c.status === 'accepted'}
                        onClick={() => handleResponder(c.startup, 'accepted')}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <CheckIcon className="size-3.5" />
                        Aceitar
                      </button>
                      <button
                        type="button"
                        disabled={ocupado || c.status === 'declined'}
                        onClick={() => handleResponder(c.startup, 'declined')}
                        className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Recusar
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="mt-6 flex justify-end border-t border-brand-100 pt-4">
          <button
            type="button"
            onClick={aoFechar}
            className="rounded-xl px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-brand-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
