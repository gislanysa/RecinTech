import {
  listarConexoesStartup,
  responderConexaoStartup,
  type ConexaoBackend,
} from '@/lib/api.ts'
import { buscarDemandasDisponiveis } from '@/lib/demandas.ts'
import type { Tags } from '@/lib/perfil.ts'
import { carregarTagsDaStartup } from '@/lib/startups.ts'

export type Oportunidade = {
  id: string
  empresa: string
  demanda: string
  /** 0–100. Valor calculado com base na similaridade entre a startup e a demanda. */
  compatibilidade: number
  tecnologias: string[]
  segmento?: string
  servicos?: string[]
  orcamento?: number
}

export type OrigemDosDados = 'api'

export type StatusConexao = 'pendente' | 'aceito' | 'recusado'

export type Conexao = {
  id: string
  company_id?: string
  startup_id?: string
  oportunidade: Oportunidade
  iniciado_por: 'startup' | 'company'
  status: StatusConexao
  created_at: string
  /** Preenchido quando a empresa responde. */
  respondido_em?: string
}

/** Ids de demandas que já viraram candidatura ou foram ignoradas pela startup. */
const inscritas = new Set<string>()

function normalizarStatusBackend(status: ConexaoBackend['status']): StatusConexao {
  switch (status) {
    case 'accepted':
      return 'aceito'
    case 'declined':
      return 'recusado'
    default:
      return 'pendente'
  }
}

/**
 * GET /api/startup/:id/connection
 *
 * Lista as conexões recebidas ou iniciadas pela startup via backend.
 */
export async function listarConexoes(startupId?: string): Promise<{
  conexoes: Conexao[]
  origem: OrigemDosDados
}> {
  if (startupId) {
    try {
      const dados = await listarConexoesStartup(startupId)
      if (Array.isArray(dados)) {
        const conexoesReais: Conexao[] = dados.map((c) => ({
          id: `${c.company}-${c.startup}`,
          company_id: c.company,
          startup_id: c.startup,
          oportunidade: {
            id: `demanda-${c.company}`,
            empresa: 'Empresa Parceira',
            demanda: 'Solicitação de conexão e parceria com a sua startup.',
            compatibilidade: 100,
            tecnologias: [],
          },
          iniciado_por: 'company',
          status: normalizarStatusBackend(c.status),
          created_at: c.created_at,
          respondido_em: c.updated_at !== c.created_at ? c.updated_at : undefined,
        }))
        return { conexoes: conexoesReais, origem: 'api' }
      }
    } catch {
      // Retorna lista vazia em caso de falha no endpoint
      return { conexoes: [], origem: 'api' }
    }
  }

  return { conexoes: [], origem: 'api' }
}

/**
 * PATCH /api/startup/:id/connection/:company_id
 *
 * Atualiza o status da conexão da perspectiva da startup ('accepted' ou 'declined').
 */
export async function responderSolicitacaoConexao(
  startupId: string,
  companyId: string,
  status: 'accepted' | 'declined',
): Promise<ConexaoBackend> {
  return responderConexaoStartup(startupId, companyId, status)
}

/**
 * Calcula a compatibilidade percentual (0 a 100) entre o perfil técnico da startup
 * (área, segmentos, serviços, tecnologias e faixa de preço) e os requisitos cadastrados na demanda da empresa.
 *
 * Retorna 0 quando não houver qualquer similaridade relevante.
 */
function calcularAjusteFatorPreco(faixaPreco?: number, orcamento?: number): number {
  if (!orcamento || orcamento <= 0) return 0
  if (!faixaPreco || faixaPreco <= 0) return 4
  if (faixaPreco <= orcamento) return 10
  if (faixaPreco <= orcamento * 1.25) return 4
  return -8
}

export function calcularCompatibilidadeDemanda(
  tags: {
    area?: string
    segments?: string[]
    services?: string[]
    technologies?: string[]
    faixaPreco?: number
  } | null | undefined,
  demanda: {
    segmento?: string
    servicos?: string[]
    tecnologias?: string[]
    orcamento?: number
  },
): number {
  if (!tags) return 0

  const segmentosStartup = [tags.area, ...(tags.segments ?? [])]
    .filter(Boolean)
    .map((s) => s!.trim().toLowerCase())
  const servicosStartup = (tags.services ?? []).map((s) => s.trim().toLowerCase())
  const tecsStartup = (tags.technologies ?? []).map((t) => t.trim().toLowerCase())

  const segmentoDemanda = demanda.segmento?.trim().toLowerCase()
  const servicosDemanda = (demanda.servicos ?? []).map((s) => s.trim().toLowerCase())
  const tecsDemanda = (demanda.tecnologias ?? []).map((t) => t.trim().toLowerCase())

  // Match de segmento / área
  const matchSegmento = Boolean(
    segmentoDemanda && segmentosStartup.some((seg) => seg === segmentoDemanda),
  )

  // Match de serviços
  const servicosComuns = servicosDemanda.filter((s) => servicosStartup.includes(s))

  // Match de tecnologias
  const tecsComuns = tecsDemanda.filter((t) => tecsStartup.includes(t))

  // Se não coincidir em nada, pontuação é 0 (não é recomendação)
  if (!matchSegmento && servicosComuns.length === 0 && tecsComuns.length === 0) {
    return 0
  }

  // Se houver similaridade real, calcula pontuação proporcional entre 60% e 99%
  let score = 50

  if (matchSegmento) {
    score += 20
  }

  if (servicosDemanda.length > 0) {
    score += Math.round((servicosComuns.length / servicosDemanda.length) * 15)
  } else if (servicosComuns.length > 0) {
    score += 15
  }

  if (tecsDemanda.length > 0) {
    score += Math.round((tecsComuns.length / tecsDemanda.length) * 15)
  } else if (tecsComuns.length > 0) {
    score += 15
  }

  // Inserção do Fator Valor no Score
  score += calcularAjusteFatorPreco(tags.faixaPreco, demanda.orcamento)

  return Math.min(99, Math.max(60, score))
}

/**
 * Lista as oportunidades reais recomendadas para a startup com base no perfil
 * e similaridade com as demandas cadastradas pelas empresas.
 *
 * Não utiliza dados falsos ou simulados: se não houver demandas correspondentes,
 * retorna lista vazia para exibição do estado de busca da plataforma.
 */
export async function listarOportunidades(
  startupId?: string,
  tagsInformadas?: Tags | null,
): Promise<{
  oportunidades: Oportunidade[]
  origem: OrigemDosDados
}> {
  let tags: Tags | null = tagsInformadas ?? null
  if (!tags && startupId) {
    try {
      tags = await carregarTagsDaStartup(startupId)
    } catch {
      tags = null
    }
  }

  const demandas = await buscarDemandasDisponiveis()
  const abertas = demandas.filter(
    (d) => (d.status === 'aberta' || d.status === 'open') && !inscritas.has(d.id),
  )

  const recomendadas: Oportunidade[] = []

  for (const dem of abertas) {
    const compatibilidade = calcularCompatibilidadeDemanda(tags, dem)
    if (compatibilidade > 0) {
      recomendadas.push({
        id: dem.id,
        empresa: dem.empresa_nome || 'Empresa Parceira',
        demanda: dem.descricao || dem.titulo,
        compatibilidade,
        tecnologias: dem.tecnologias ?? [],
        segmento: dem.segmento,
        servicos: dem.servicos,
        orcamento: dem.orcamento,
      })
    }
  }

  // Ordena pelas maiores compatibilidades primeiro
  recomendadas.sort((a, b) => b.compatibilidade - a.compatibilidade)

  return {
    oportunidades: recomendadas,
    origem: 'api',
  }
}

/**
 * Manifesta interesse na oportunidade (candidatura em memória/cache de sessão).
 */
export async function manifestarInteresse(oportunidadeId: string): Promise<void> {
  inscritas.add(oportunidadeId)
}

/**
 * Remove a oportunidade das recomendações da startup na sessão.
 */
export async function ignorarOportunidade(oportunidadeId: string): Promise<void> {
  inscritas.add(oportunidadeId)
}
