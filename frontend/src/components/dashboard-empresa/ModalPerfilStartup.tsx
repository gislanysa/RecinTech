import Botao from '@/components/Botao.tsx'
import { CheckIcon, CloseIcon } from '@/components/icons.tsx'
import { enviarConviteReuniao, type Demanda } from '@/lib/demandas.ts'
import type { StartupCatalogo } from '@/lib/startups.ts'
import { useEffect, useState } from 'react'

type ModalPerfilStartupProps = {
  startup: StartupCatalogo | null
  demandas: Demanda[]
  demandaSugeridaId?: string
  companyId: string
  aoFechar: () => void
  onConviteEnviado?: () => void
}

/**
 * Calcula o tempo aproximado desde o cadastro da startup na plataforma.
 */
function calcularTempoAtuacao(dataCriacao: string): string {
  try {
    const criacao = new Date(dataCriacao)
    const agora = new Date()
    const diffMeses = (agora.getFullYear() - criacao.getFullYear()) * 12 + (agora.getMonth() - criacao.getMonth())

    if (diffMeses <= 1) return 'Recém-chegada na plataforma'
    if (diffMeses < 12) return `${diffMeses} meses na plataforma`
    const anos = Math.floor(diffMeses / 12)
    return `${anos} ${anos === 1 ? 'ano' : 'anos'} na plataforma`
  } catch {
    return 'Tempo na plataforma não informado'
  }
}

export default function ModalPerfilStartup(props: ModalPerfilStartupProps) {
  if (!props.startup) return null
  return <ConteudoModalPerfilStartup key={props.startup.id} {...props} startup={props.startup} />
}

function ConteudoModalPerfilStartup({
  startup,
  demandas,
  demandaSugeridaId,
  companyId,
  aoFechar,
  onConviteEnviado,
}: ModalPerfilStartupProps & { startup: StartupCatalogo }) {
  const [demandaSelecionada, setDemandaSelecionada] = useState(
    demandaSugeridaId ?? (demandas[0]?.id ?? ''),
  )
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [conviteSucesso, setConviteSucesso] = useState(false)
  const [mostrarFormReuniao, setMostrarFormReuniao] = useState(false)
  const [erroEnvio, setErroEnvio] = useState('')

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aoFechar])

  async function handleEnviarConvite(e: React.FormEvent) {
    e.preventDefault()
    if (!startup) return
    setEnviando(true)
    setErroEnvio('')

    try {
      const demandaObj = demandas.find((d) => d.id === demandaSelecionada)
      await enviarConviteReuniao(companyId, {
        startupId: startup.id,
        startupNome: startup.name,
        demandaId: demandaObj?.id,
        demandaTitulo: demandaObj?.titulo,
        mensagem: mensagem.trim() || undefined,
      })
      setConviteSucesso(true)
      setMostrarFormReuniao(false)
      onConviteEnviado?.()
    } catch {
      setErroEnvio('Erro ao enviar convite. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const estagioRotulo =
    startup.stage === 'scaling' ? 'Escala — operação consolidada' : 'Tração — crescimento acelerado'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="perfil-startup-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={aoFechar}
        className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm transition-opacity"
      />

      {/* Card ampliado em destaque */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl bg-surface shadow-2xl ring-1 ring-brand-100">
        {/* Cabeçalho do perfil */}
        <div className="flex items-start justify-between border-b border-brand-100 p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 font-display text-xl font-bold text-white shadow-md sm:size-16 sm:text-2xl">
              {startup.initials || startup.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="perfil-startup-titulo"
                  className="font-display text-xl font-bold text-ink-900 sm:text-2xl"
                >
                  {startup.name}
                </h2>
                <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                  {startup.stage === 'scaling' ? 'Escala' : 'Tração'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-500 sm:text-sm">
                {startup.city}, {startup.state} • {calcularTempoAtuacao(startup.created_at)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar perfil"
            className="grid size-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-brand-50 hover:text-ink-900"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        {/* Corpo com scroll interno */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="flex flex-col gap-6">
            {/* Mensagem de sucesso do convite */}
            {conviteSucesso && (
              <div
                role="status"
                className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200"
              >
                <div className="grid size-6 place-items-center rounded-full bg-emerald-600 text-white">
                  <CheckIcon className="size-4" />
                </div>
                <div>
                  <p className="font-semibold">Convite para reunião enviado com sucesso!</p>
                  <p className="text-xs text-emerald-700">
                    A startup foi notificada e o convite está registrado na aba de Conexões.
                  </p>
                </div>
              </div>
            )}

            {/* 5.1 Descrição e identificação */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Sobre a startup
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">
                {startup.description || 'Nenhuma descrição detalhada informada pela startup.'}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-surface-2 p-3.5 text-xs text-ink-700 sm:grid-cols-3">
                <div>
                  <span className="text-ink-500">Maturidade:</span>
                  <p className="font-medium">{estagioRotulo}</p>
                </div>
                <div>
                  <span className="text-ink-500">Localização:</span>
                  <p className="font-medium">
                    {startup.city} - {startup.state}
                  </p>
                </div>
                {startup.website && (
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-ink-500">Site oficial:</span>
                    <p className="truncate">
                      <a
                        href={
                          startup.website.startsWith('http')
                            ? startup.website
                            : `https://${startup.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-brand-600 hover:underline"
                      >
                        {startup.website.replace(/^https?:\/\//, '')}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 5.3 Serviços, Tecnologias e Segmentos */}
            <div className="flex flex-col gap-4 border-t border-brand-100 pt-5">
              {/* Segmentos */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Segmentos de atuação
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {startup.segments.length > 0 ? (
                    startup.segments.map((seg) => (
                      <span
                        key={seg}
                        className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-200"
                      >
                        {seg}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-ink-500">Nenhum segmento listado</span>
                  )}
                </div>
              </div>

              {/* Serviços */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Soluções e serviços oferecidos
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {startup.services.length > 0 ? (
                    startup.services.map((srv) => (
                      <span
                        key={srv}
                        className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-800 ring-1 ring-brand-200"
                      >
                        {srv}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-ink-500">Nenhum serviço listado</span>
                  )}
                </div>
              </div>

              {/* Tecnologias */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Tecnologias utilizadas
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {startup.technologies.length > 0 ? (
                    startup.technologies.map((tec) => (
                      <span
                        key={tec}
                        className="rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-medium text-accent-800 ring-1 ring-accent-200"
                      >
                        {tec}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-ink-500">Nenhuma tecnologia listada</span>
                  )}
                </div>
              </div>
            </div>

            {/* 5.2 Avaliações de outras empresas (respeitando a ausência de dados no backend) */}
            <div className="border-t border-brand-100 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Avaliações de empresas parceiras
              </h3>
              <div className="mt-2 rounded-xl border border-dashed border-brand-200 bg-surface-2/60 p-4 text-center">
                <p className="text-xs text-ink-500">
                  Esta startup ainda não possui avaliações públicas registradas na plataforma.
                </p>
                <p className="mt-1 text-[11px] text-ink-500/80">
                  As avaliações são geradas após a conclusão de projetos ou conexões verificadas.
                </p>
              </div>
            </div>

            {/* 5.4 Cases de sucesso e projetos realizados */}
            <div className="border-t border-brand-100 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Cases de sucesso e projetos realizados
              </h3>
              <div className="mt-2 rounded-xl border border-dashed border-brand-200 bg-surface-2/60 p-4 text-center">
                <p className="text-xs text-ink-500">
                  Esta startup ainda não possui cases de sucesso publicados no catálogo.
                </p>
              </div>
            </div>

            {/* Formulário de convite para reunião (quando acionado) */}
            {mostrarFormReuniao && !conviteSucesso && (
              <form
                onSubmit={handleEnviarConvite}
                className="flex flex-col gap-3 rounded-2xl border border-brand-200 bg-brand-50/50 p-4 sm:p-5"
              >
                <h4 className="font-display text-sm font-semibold text-ink-900">
                  Convidar {startup.name} para uma reunião
                </h4>

                {demandas.length > 0 && (
                  <div>
                    <label
                      htmlFor="convite-demanda"
                      className="block text-xs font-medium text-ink-700"
                    >
                      Vincular a uma demanda da sua empresa:
                    </label>
                    <select
                      id="convite-demanda"
                      value={demandaSelecionada}
                      onChange={(e) => setDemandaSelecionada(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-brand-200 bg-surface px-3 py-2 text-xs text-ink-900 outline-none focus:ring-2 focus:ring-accent-500"
                    >
                      {demandas.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.titulo} ({d.segmento})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="convite-mensagem"
                    className="block text-xs font-medium text-ink-700"
                  >
                    Mensagem de apresentação (opcional):
                  </label>
                  <textarea
                    id="convite-mensagem"
                    rows={2}
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Olá! Gostaríamos de conversar sobre nossa demanda tecnológica..."
                    className="mt-1 w-full rounded-xl border border-brand-200 bg-surface px-3 py-2 text-xs text-ink-900 outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>

                {erroEnvio && (
                  <p role="alert" className="text-xs text-red-500">
                    {erroEnvio}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarFormReuniao(false)}
                    disabled={enviando}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-brand-100"
                  >
                    Cancelar
                  </button>
                  <Botao type="submit" disabled={enviando}>
                    {enviando ? 'Enviando convite…' : 'Confirmar convite'}
                  </Botao>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* 5.5 Rodapé com Ações do perfil */}
        <div className="flex items-center justify-between border-t border-brand-100 bg-surface-2/40 p-4 sm:p-5">
          <button
            type="button"
            onClick={aoFechar}
            className="rounded-xl px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-brand-50 hover:text-ink-900"
          >
            Fechar
          </button>

          {!conviteSucesso && !mostrarFormReuniao && (
            <Botao onClick={() => setMostrarFormReuniao(true)}>
              Convidar para reunião
            </Botao>
          )}
        </div>
      </div>
    </div>
  )
}
