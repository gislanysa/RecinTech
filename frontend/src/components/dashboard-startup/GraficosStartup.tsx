import { useEffect, useMemo, useState } from 'react'
import type { Conexao } from '@/lib/oportunidades.ts'
import type { Tags } from '@/lib/perfil.ts'
import { buscarDemandasDisponiveis, type Demanda } from '@/lib/demandas.ts'

interface GraficosStartupProps {
  conexoes: Conexao[] | null
  tags?: Tags | null
  demandasIniciais?: Demanda[]
}

/**
 * Gráficos Visuais do Dashboard da Startup
 */
export default function GraficosStartup({
  conexoes,
  tags,
  demandasIniciais,
}: Readonly<GraficosStartupProps>) {
  const [demandas, setDemandas] = useState<Demanda[]>(demandasIniciais ?? [])
  const [carregandoDemandas, setCarregandoDemandas] = useState(
    !demandasIniciais,
  )

  // Carrega as demandas abertas do ecossistema para mapear a distribuição técnica de mercado
  useEffect(() => {
    if (demandasIniciais) return

    let ativo = true

    buscarDemandasDisponiveis()
      .then((dados) => {
        if (ativo) {
          const abertas = dados.filter(
            (d) => d.status === 'aberta' || d.status === 'open',
          )
          setDemandas(abertas)
        }
      })
      .catch(() => {
        if (ativo) setDemandas([])
      })
      .finally(() => {
        if (ativo) setCarregandoDemandas(false)
      })

    return () => {
      ativo = false
    }
  }, [demandasIniciais])

  // Métricas do Gráfico 1: Demandas por Segmento Técnico
  const metricasSegmentos = useMemo(() => {
    const totalDemandas = demandas.length
    if (totalDemandas === 0) {
      return { total: 0, segmentos: [] }
    }

    // Mapeamento de contagem por segmento e tecnologia
    const contagem: Record<string, number> = {}

    for (const d of demandas) {
      const seg = d.segmento?.trim() || 'Tecnologia Geral'
      contagem[seg] = (contagem[seg] || 0) + 1

      // Considera também tecnologias primárias
      if (Array.isArray(d.tecnologias)) {
        for (const t of d.tecnologias) {
          const tecLimpa = t.trim()
          if (tecLimpa) {
            contagem[tecLimpa] = (contagem[tecLimpa] || 0) + 1
          }
        }
      }
    }

    const tagsStartup = [
      tags?.area,
      ...(tags?.segments ?? []),
      ...(tags?.technologies ?? []),
    ]
      .filter(Boolean)
      .map((t) => t!.toLowerCase().trim())

    // Ordena do mais demandado para o menos demandado e pega o top 5
    const ordenados = Object.entries(contagem)
      .map(([nome, qtd]) => {
        const pct = Math.round((qtd / totalDemandas) * 100)
        const compativel = tagsStartup.some(
          (t) => t.includes(nome.toLowerCase()) || nome.toLowerCase().includes(t),
        )
        return { nome, qtd, pct, compativel }
      })
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5)

    return {
      total: totalDemandas,
      segmentos: ordenados,
    }
  }, [demandas, tags])

  // Métricas do Gráfico 2: Proporção de Propostas Aceitas
  const metricasPropostas = useMemo(() => {
    const lista = conexoes ?? []
    const total = lista.length
    const aceitas = lista.filter((c) => c.status === 'aceito').length
    const pendentes = lista.filter((c) => c.status === 'pendente').length
    const recusadas = lista.filter((c) => c.status === 'recusado').length

    const taxaAceite = total > 0 ? Math.round((aceitas / total) * 100) : 0
    const pctPendentes = total > 0 ? Math.round((pendentes / total) * 100) : 0
    const pctRecusadas = total > 0 ? Math.round((recusadas / total) * 100) : 0

    return {
      total,
      aceitas,
      pendentes,
      recusadas,
      taxaAceite,
      pctPendentes,
      pctRecusadas,
    }
  }, [conexoes])

  // Parâmetros para o Donut SVG (Raio = 38, Circunferência ≈ 238.76)
  const raio = 38
  const circunferencia = 2 * Math.PI * raio
  const dashAceitas = (metricasPropostas.taxaAceite / 100) * circunferencia
  const dashPendentes = (metricasPropostas.pctPendentes / 100) * circunferencia
  const dashRecusadas = (metricasPropostas.pctRecusadas / 100) * circunferencia

  const offsetAceitas = 0
  const offsetPendentes = -dashAceitas
  const offsetRecusadas = -(dashAceitas + dashPendentes)

  let conteudoSegmentos = (
    <div className="mt-6 space-y-3.5">
      {metricasSegmentos.segmentos.map((item) => (
        <div key={item.nome}>
          <div className="flex items-center justify-between text-xs font-medium text-ink-700">
            <div className="flex items-center gap-1.5 truncate">
              <span className="truncate font-semibold text-ink-900">{item.nome}</span>
              {item.compativel && (
                <span className="inline-flex shrink-0 items-center rounded-md bg-accent-100 px-1.5 py-0.2 text-[10px] font-semibold text-accent-700">
                  Seu perfil
                </span>
              )}
            </div>
            <span className="shrink-0 text-ink-500">
              {item.qtd} {item.qtd === 1 ? 'demanda' : 'demandas'} ({item.pct}%)
            </span>
          </div>
          <div className="mt-1.5 h-2.5 w-full rounded-full bg-brand-50">
            <div
              className={[
                'h-2.5 rounded-full transition-all duration-500',
                item.compativel ? 'bg-accent-500' : 'bg-brand-600',
              ].join(' ')}
              style={{ width: `${Math.min(100, Math.max(8, item.pct))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )

  if (carregandoDemandas) {
    conteudoSegmentos = (
      <div className="my-8 flex h-48 animate-pulse items-center justify-center rounded-xl bg-brand-50">
        <span className="text-xs font-medium text-ink-500">
          Mapeando demandas de mercado...
        </span>
      </div>
    )
  } else if (metricasSegmentos.segmentos.length === 0) {
    conteudoSegmentos = (
      <div className="my-6 flex flex-col items-center justify-center rounded-xl bg-surface-2/40 p-6 text-center">
        <svg
          className="size-12 text-ink-400 stroke-1"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
        <p className="mt-3 text-sm font-semibold text-ink-900">
          Nenhuma demanda mapeada ainda
        </p>
        <p className="mt-1 max-w-xs text-xs text-ink-500">
          Novas oportunidades cadastradas por empresas contratantes aparecerão aqui agrupadas por área técnica.
        </p>
      </div>
    )
  }

  let conteudoPropostas = (
    <div className="mt-6 flex flex-col items-center sm:flex-row sm:items-center sm:justify-around gap-6">
      {/* Donut Chart SVG */}
      <div className="relative flex items-center justify-center">
        <svg
          className="size-36 -rotate-90 transform"
          viewBox="0 0 100 100"
          aria-label="Gráfico em donut de propostas aceitas"
        >
          {/* Círculo base */}
          <circle
            cx="50"
            cy="50"
            r={raio}
            className="stroke-brand-50"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Aceitas (Marca/Escuro) */}
          {metricasPropostas.aceitas > 0 && (
            <circle
              cx="50"
              cy="50"
              r={raio}
              className="stroke-brand-600 transition-all duration-500"
              strokeWidth="12"
              strokeDasharray={`${dashAceitas} ${circunferencia}`}
              strokeDashoffset={offsetAceitas}
              strokeLinecap="round"
              fill="transparent"
            />
          )}
          {/* Pendentes (Azul claro) */}
          {metricasPropostas.pendentes > 0 && (
            <circle
              cx="50"
              cy="50"
              r={raio}
              className="stroke-brand-400 transition-all duration-500"
              strokeWidth="12"
              strokeDasharray={`${dashPendentes} ${circunferencia}`}
              strokeDashoffset={offsetPendentes}
              strokeLinecap="round"
              fill="transparent"
            />
          )}
          {/* Recusadas (Tinta/Cinza) */}
          {metricasPropostas.recusadas > 0 && (
            <circle
              cx="50"
              cy="50"
              r={raio}
              className="stroke-ink-400 transition-all duration-500"
              strokeWidth="12"
              strokeDasharray={`${dashRecusadas} ${circunferencia}`}
              strokeDashoffset={offsetRecusadas}
              strokeLinecap="round"
              fill="transparent"
            />
          )}
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="font-display text-2xl font-bold text-ink-900">
            {metricasPropostas.taxaAceite}%
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-ink-500">
            Conversão
          </span>
        </div>
      </div>

      {/* Legendas e contadores */}
      <div className="flex w-full max-w-xs flex-col gap-3">
        <div>
          <div className="flex justify-between text-xs font-medium text-ink-700">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-brand-600" />
              <span>Propostas Aceitas (Match)</span>
            </span>
            <span>
              {metricasPropostas.taxaAceite}% ({metricasPropostas.aceitas})
            </span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-brand-50">
            <div
              className="h-2 rounded-full bg-brand-600 transition-all duration-500"
              style={{ width: `${metricasPropostas.taxaAceite}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium text-ink-700">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-brand-400" />
              <span>Em Análise (Aguardando)</span>
            </span>
            <span>
              {metricasPropostas.pctPendentes}% ({metricasPropostas.pendentes})
            </span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-brand-50">
            <div
              className="h-2 rounded-full bg-brand-400 transition-all duration-500"
              style={{ width: `${metricasPropostas.pctPendentes}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium text-ink-700">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-ink-400" />
              <span>Não seguiu (Recusadas)</span>
            </span>
            <span>
              {metricasPropostas.pctRecusadas}% ({metricasPropostas.recusadas})
            </span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-brand-50">
            <div
              className="h-2 rounded-full bg-ink-400 transition-all duration-500"
              style={{ width: `${metricasPropostas.pctRecusadas}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )

  if (conexoes === null) {
    conteudoPropostas = (
      <div className="my-8 flex h-48 animate-pulse items-center justify-center rounded-xl bg-brand-50">
        <span className="text-xs font-medium text-ink-500">
          Carregando conexões...
        </span>
      </div>
    )
  } else if (metricasPropostas.total === 0) {
    conteudoPropostas = (
      <div className="my-6 flex flex-col items-center justify-center rounded-xl bg-surface-2/40 p-6 text-center">
        <p className="text-sm font-semibold text-ink-900">
          Nenhuma proposta enviada ainda
        </p>
        <p className="mt-1 max-w-xs text-xs text-ink-500">
          Candidate-se às demandas abertas nas oportunidades para acompanhar sua taxa de conversão e aprovação.
        </p>
      </div>
    )
  }

  return (
    <section
      id="secao-indicadores-startup"
      aria-label="Indicadores de mercado e propostas da startup"
      className="flex flex-col gap-4"
    >
      <div>
        <h2 className="font-display text-lg font-bold text-ink-900 sm:text-xl">
          Inteligência de Mercado e Propostas
        </h2>
        <p className="text-xs text-ink-500">
          Segmentos mais demandados pelas empresas parceiras e taxa de aceitação das suas propostas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico 1: Demandas por Segmento Técnico */}
        <div
          id="card-grafico-segmentos"
          className="flex flex-col justify-between rounded-card bg-surface p-5 shadow-sm sm:p-6"
        >
          <div>
            <div>
              <h3 className="font-display text-base font-semibold text-ink-900">
                Demandas por Segmento Técnico
              </h3>
            </div>
            <p className="mt-1 text-xs text-ink-500">
              Áreas técnicas e tecnologias mais requisitadas por empresas no ecossistema
            </p>

            {conteudoSegmentos}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between border-t border-surface-2 pt-3 text-xs text-ink-500">
            <span>
              Mapeamento em tempo real do ecossistema
            </span>
            <span className="text-brand-600 font-medium">RecInTech Radar</span>
          </div>
        </div>

        {/* Gráfico 2: Proporção de Propostas Aceitas */}
        <div
          id="card-grafico-propostas"
          className="flex flex-col justify-between rounded-card bg-surface p-5 shadow-sm sm:p-6"
        >
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-ink-900">
                Proporção de Propostas Aceitas
              </h3>
              {metricasPropostas.total > 0 && (
                <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                  {metricasPropostas.taxaAceite}% de Aceite
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-ink-500">
              Taxa de conversão das suas manifestações de interesse e conexões com empresas
            </p>

            {conteudoPropostas}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between border-t border-surface-2 pt-3 text-xs text-ink-500">
            <span>
              Total de interações:{' '}
              <strong className="text-ink-900">
                {metricasPropostas.total} {metricasPropostas.total === 1 ? 'proposta' : 'propostas'}
              </strong>
            </span>
            <span className="text-brand-600 font-medium">Taxa de Conversão</span>
          </div>
        </div>
      </div>
    </section>
  )
}
