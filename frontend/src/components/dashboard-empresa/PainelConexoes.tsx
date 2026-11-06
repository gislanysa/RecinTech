import Botao from '@/components/Botao.tsx'
import type { ConviteReuniao } from '@/lib/demandas.ts'

type PainelConexoesProps = {
  convites: ConviteReuniao[]
  carregando: boolean
  onExplorarRecomendacoes: () => void
}

function badgeStatusConvite(status: ConviteReuniao['status']) {
  switch (status) {
    case 'pendente':
      return {
        texto: 'Aguardando resposta',
        classe: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      }
    case 'aceito':
      return {
        texto: 'Conexão confirmada',
        classe: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      }
    case 'recusado':
      return {
        texto: 'Recusado',
        classe: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
      }
  }
}

export default function PainelConexoes({
  convites,
  carregando,
  onExplorarRecomendacoes,
}: PainelConexoesProps) {
  return (
    <section aria-labelledby="titulo-conexoes" className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 id="titulo-conexoes" className="font-display text-xl font-bold text-ink-900 sm:text-2xl">
            Conexões e reuniões
          </h2>
          {!carregando && (
            <span className="text-base font-semibold text-ink-500 sm:text-lg">
              ({convites.length})
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-ink-500 sm:text-sm">
          Acompanhe os convites de reuniões e as interações iniciadas com startups parceiras.
        </p>
      </div>

      {carregando && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-brand-100 bg-surface p-5"
            >
              <div className="h-4 w-1/3 rounded bg-brand-100" />
              <div className="mt-2 h-3 w-1/4 rounded bg-brand-50" />
            </div>
          ))}
        </div>
      )}

      {!carregando && convites.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-surface px-6 py-12 text-center">
          <h3 className="font-display text-base font-semibold text-ink-900">
            Nenhuma conexão iniciada ainda
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-ink-500 sm:text-sm">
            Ao encontrar startups recomendadas para as suas demandas, envie um convite para reunião
            para iniciar o contato direto.
          </p>
          <div className="mt-6">
            <Botao onClick={onExplorarRecomendacoes}>Ver startups recomendadas</Botao>
          </div>
        </div>
      )}

      {!carregando && convites.length > 0 && (
        <div className="flex flex-col gap-3">
          {convites.map((convite) => {
            const statusInfo = badgeStatusConvite(convite.status)
            const dataFormatada = new Date(convite.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })

            return (
              <div
                key={convite.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-brand-100 bg-surface p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display text-base font-bold text-ink-900">
                      {convite.startup_nome}
                    </h3>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.classe}`}
                    >
                      {statusInfo.texto}
                    </span>
                  </div>

                  {convite.demanda_titulo && (
                    <p className="mt-1 text-xs text-ink-500">
                      Demanda vinculada:{' '}
                      <strong className="text-ink-700">{convite.demanda_titulo}</strong>
                    </p>
                  )}

                  {convite.mensagem && (
                    <p className="mt-2 text-xs italic text-ink-600 sm:text-sm">
                      "{convite.mensagem}"
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right text-xs text-ink-500">
                  <span>Enviado em {dataFormatada}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
