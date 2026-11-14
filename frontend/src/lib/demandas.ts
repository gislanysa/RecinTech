import { api } from '@/lib/api.ts'
import type { StartupCatalogo } from '@/lib/startups.ts'

export type StatusDemanda = 'aberta' | 'em_andamento' | 'encerrada'

export type Demanda = {
  id: string
  company_id: string
  titulo: string
  descricao: string
  segmento: string
  servicos: string[]
  tecnologias: string[]
  status: StatusDemanda
  created_at: string
}

export type CriarDemandaPayload = {
  titulo: string
  descricao: string
  segmento: string
  servicos: string[]
  tecnologias: string[]
}

export type AtualizarDemandaPayload = {
  titulo: string
  descricao: string
  segmento: string
  servicos: string[]
  tecnologias: string[]
  status?: StatusDemanda
}

export type ConviteReuniao = {
  id: string
  company_id: string
  startup_id: string
  startup_nome: string
  demanda_id?: string
  demanda_titulo?: string
  mensagem?: string
  status: 'pendente' | 'aceito' | 'recusado'
  created_at: string
}

export type EnviarConvitePayload = {
  startupId: string
  startupNome: string
  demandaId?: string
  demandaTitulo?: string
  mensagem?: string
}

export type Recomendacao = {
  startup: StartupCatalogo
  demanda: Demanda
  motivos: string[]
}

export const LIMITE_PADRAO_DEMANDAS = 100

/**
 * GET /api/company/:companyId/demand?limit=&offset=
 *
 * Lista as demandas da empresa cadastradas no backend, de forma paginada.
 */
export async function listarDemandas(
  companyId: string,
  limit: number = LIMITE_PADRAO_DEMANDAS,
  offset: number = 0,
): Promise<Demanda[]> {
  const { data } = await api.get<any[]>(`/company/${companyId}/demand`, {
    params: {
      limit: Math.max(1, Math.floor(limit)),
      offset: Math.max(0, Math.floor(offset)),
    },
  })

  if (!Array.isArray(data)) {
    return []
  }

  return data.map((item) => {
    // Normaliza status do backend Gleam ('open' -> 'aberta', 'closed' -> 'encerrada', 'canceled' -> 'encerrada')
    let statusNormalizado: StatusDemanda = 'aberta'
    const statusBruto = item.status || item.demand_status
    if (statusBruto === 'closed' || statusBruto === 'canceled' || statusBruto === 'encerrada') {
      statusNormalizado = 'encerrada'
    } else if (statusBruto === 'em_andamento') {
      statusNormalizado = 'em_andamento'
    }

    return {
      id: item.id,
      company_id: item.company_id || companyId,
      titulo: item.titulo ?? item.title ?? '',
      descricao: item.descricao ?? item.description ?? '',
      segmento: item.segmento ?? (Array.isArray(item.segments) && item.segments[0]?.name ? item.segments[0].name : ''),
      servicos: Array.isArray(item.servicos)
        ? item.servicos
        : Array.isArray(item.services)
          ? item.services.map((s: any) => (typeof s === 'string' ? s : s.name ?? ''))
          : [],
      tecnologias: Array.isArray(item.tecnologias)
        ? item.tecnologias
        : Array.isArray(item.technologies)
          ? item.technologies.map((t: any) => (typeof t === 'string' ? t : t.name ?? ''))
          : [],
      status: statusNormalizado,
      created_at: item.created_at ?? new Date().toISOString(),
    }
  })
}

/**
 * POST /api/company/:companyId/demand
 *
 * Cria uma nova demanda da empresa no backend.
 */
export async function criarDemanda(
  companyId: string,
  dados: CriarDemandaPayload,
): Promise<Demanda> {
  const tituloLimpo = dados.titulo.trim()
  const descricaoLimpa = dados.descricao.trim()

  const payload: Record<string, unknown> = {
    // Campos esperados pelo backend Gleam
    title: tituloLimpo,
    description: descricaoLimpa,
    status: 'open',
    segments: [],
    services: [],
    expertises: [],
    technologies: [],
    // Campos legados para compatibilidade
    titulo: tituloLimpo,
    descricao: descricaoLimpa,
    segmento: dados.segmento,
    servicos: dados.servicos,
    tecnologias: dados.tecnologias,
  }

  const { data } = await api.post<any>(`/company/${companyId}/demand`, payload)
  const item = data.demand ?? data

  return {
    id: item.id,
    company_id: item.company_id || companyId,
    titulo: item.titulo ?? item.title ?? tituloLimpo,
    descricao: item.descricao ?? item.description ?? descricaoLimpa,
    segmento: dados.segmento,
    servicos: dados.servicos,
    tecnologias: dados.tecnologias,
    status: 'aberta',
    created_at: item.created_at ?? new Date().toISOString(),
  }
}

/**
 * PATCH /api/company/demand/:id
 *
 * Atualiza os dados de uma demanda existente no backend.
 */
export async function atualizarDemanda(
  companyIdOrDemandaId: string,
  demandaIdOrDados: string | AtualizarDemandaPayload,
  talvezDados?: AtualizarDemandaPayload,
): Promise<Demanda> {
  const demandaId = typeof demandaIdOrDados === 'string' ? demandaIdOrDados : companyIdOrDemandaId
  const dados = (typeof demandaIdOrDados === 'string' ? talvezDados : demandaIdOrDados) as AtualizarDemandaPayload

  const tituloLimpo = dados.titulo?.trim()
  const descricaoLimpa = dados.descricao?.trim()

  const payload: Record<string, unknown> = {
    title: tituloLimpo,
    description: descricaoLimpa,
    titulo: tituloLimpo,
    descricao: descricaoLimpa,
    segmento: dados.segmento,
    servicos: dados.servicos,
    tecnologias: dados.tecnologias,
    ...(dados.status ? { status: dados.status } : {}),
  }

  const { data } = await api.patch<any>(`/company/demand/${demandaId}`, payload)
  const item = data?.demand ?? data ?? {}

  return {
    id: item.id ?? demandaId,
    company_id: item.company_id ?? '',
    titulo: item.titulo ?? item.title ?? tituloLimpo ?? '',
    descricao: item.descricao ?? item.description ?? descricaoLimpa ?? '',
    segmento: dados.segmento ?? '',
    servicos: dados.servicos ?? [],
    tecnologias: dados.tecnologias ?? [],
    status: (dados.status as StatusDemanda) ?? 'aberta',
    created_at: item.created_at ?? new Date().toISOString(),
  }
}

/**
 * DELETE /api/company/demand/:id
 *
 * Remove uma demanda da empresa no backend.
 */
export async function excluirDemanda(
  companyIdOrDemandaId: string,
  talvezDemandaId?: string,
): Promise<void> {
  const demandaId = talvezDemandaId ?? companyIdOrDemandaId
  await api.delete(`/company/demand/${demandaId}`)
}

/**
 * GET /api/company/:companyId/connection
 *
 * Lista as conexões/convites da empresa.
 */
export async function listarConvites(companyId: string): Promise<ConviteReuniao[]> {
  try {
    const { data } = await api.get<any[]>(`/company/${companyId}/connection`)
    if (Array.isArray(data)) {
      return data.map((c) => ({
        id: `${c.company}-${c.startup}`,
        company_id: c.company,
        startup_id: c.startup,
        startup_nome: c.startup_name ?? 'Startup parceira',
        status: c.status === 'accepted' ? 'aceito' : c.status === 'declined' ? 'recusado' : 'pendente',
        created_at: c.created_at ?? new Date().toISOString(),
      }))
    }
  } catch {
    // Tenta rota legada /meetings caso seja ambiente de mock
    try {
      const { data } = await api.get<ConviteReuniao[]>(`/company/${companyId}/meetings`)
      return data
    } catch {
      return []
    }
  }
  return []
}

/**
 * POST /api/company/:companyId/connection
 *
 * Envia uma solicitação de conexão para a startup.
 */
export async function enviarConviteReuniao(
  companyId: string,
  dados: EnviarConvitePayload,
): Promise<ConviteReuniao> {
  try {
    const { data } = await api.post<any>(`/company/${companyId}/connection`, {
      startup: dados.startupId,
    })
    const statusNormalizado =
      data?.status === 'accepted'
        ? 'aceito'
        : data?.status === 'declined'
          ? 'recusado'
          : 'pendente'

    return {
      id: `${companyId}-${dados.startupId}`,
      company_id: companyId,
      startup_id: dados.startupId,
      startup_nome: dados.startupNome,
      demanda_id: dados.demandaId,
      demanda_titulo: dados.demandaTitulo,
      mensagem: dados.mensagem?.trim(),
      status: statusNormalizado,
      created_at: data?.created_at ?? new Date().toISOString(),
    }
  } catch {
    // Fallback legado /meetings
    const payload = {
      startup_id: dados.startupId,
      startup_nome: dados.startupNome,
      demanda_id: dados.demandaId,
      demanda_titulo: dados.demandaTitulo,
      mensagem: dados.mensagem?.trim(),
    }
    const { data } = await api.post<ConviteReuniao>(`/company/${companyId}/meetings`, payload)
    return data
  }
}

/**
 * Algoritmo de compatibilidade que relaciona demandas da empresa com startups do catálogo
 * com base em serviços, tecnologias e segmentos correspondentes.
 */
export function calcularRecomendacoes(
  demandas: Demanda[],
  startups: StartupCatalogo[],
  demandaFiltroId?: string,
): Recomendacao[] {
  const demandasAlvo = demandaFiltroId
    ? demandas.filter((d) => d.id === demandaFiltroId && d.status !== 'encerrada')
    : demandas.filter((d) => d.status !== 'encerrada')

  const recomendacoes: Recomendacao[] = []
  const vistas = new Set<string>()

  for (const demanda of demandasAlvo) {
    for (const startup of startups) {
      const chave = `${demanda.id}-${startup.id}`
      if (vistas.has(chave)) continue

      const motivos: string[] = []

      // Checa correspondência de segmento
      if (demanda.segmento && startup.segments.includes(demanda.segmento)) {
        motivos.push(`Segmento compatível: ${demanda.segmento}`)
      }

      // Checa correspondência de serviços
      const servicosComuns = demanda.servicos.filter((s) => startup.services.includes(s))
      if (servicosComuns.length > 0) {
        motivos.push(`Serviços: ${servicosComuns.join(', ')}`)
      }

      // Checa correspondência de tecnologias
      const tecsComuns = demanda.tecnologias.filter((t) => startup.technologies.includes(t))
      if (tecsComuns.length > 0) {
        motivos.push(`Tecnologias: ${tecsComuns.join(', ')}`)
      }

      // Se houver qualquer afinidade relevante, adiciona à lista
      if (motivos.length > 0) {
        vistas.add(chave)
        recomendacoes.push({
          startup,
          demanda,
          motivos,
        })
      }
    }
  }

  return recomendacoes
}
