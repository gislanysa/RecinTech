import { api } from '@/lib/api.ts'
import { ehUuidReal } from '@/lib/catalogos.ts'
import type { StartupCatalogo } from '@/lib/startups.ts'
import axios from 'axios'

export type StatusDemanda =
  | 'open'
  | 'closed'
  | 'canceled'
  | 'aberta'
  | 'encerrada'
  | 'cancelada'
  | 'em_andamento'

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
  segmentIds?: string[]
  serviceIds?: string[]
  technologyIds?: string[]
  expertiseIds?: string[]
  status?: StatusDemanda
}

export type AtualizarDemandaPayload = {
  titulo?: string
  descricao?: string
  segmento?: string
  servicos?: string[]
  tecnologias?: string[]
  segmentIds?: string[]
  serviceIds?: string[]
  technologyIds?: string[]
  expertiseIds?: string[]
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

export const CHAVE_DEMANDAS_PUBLICAS = 'recintech:demandas_publicas'

export type DemandaPublica = Demanda & {
  empresa_nome?: string
}

export function obterDemandasPublicas(): DemandaPublica[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(CHAVE_DEMANDAS_PUBLICAS) : null
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function salvarDemandaPublica(demanda: Demanda, empresaNome?: string): void {
  try {
    if (typeof window === 'undefined') return
    const lista = obterDemandasPublicas().filter((d) => d.id !== demanda.id)
    if (demanda.status === 'aberta' || demanda.status === 'open') {
      const empresaExistente = obterDemandasPublicas().find((d) => d.id === demanda.id)?.empresa_nome
      lista.unshift({
        ...demanda,
        empresa_nome: empresaNome || empresaExistente || 'Empresa Parceira',
      })
    }
    localStorage.setItem(CHAVE_DEMANDAS_PUBLICAS, JSON.stringify(lista))
  } catch {
    // Falha silenciosa em localStorage
  }
}

export function removerDemandaPublica(demandaId: string): void {
  try {
    if (typeof window === 'undefined') return
    const lista = obterDemandasPublicas().filter((d) => d.id !== demandaId)
    localStorage.setItem(CHAVE_DEMANDAS_PUBLICAS, JSON.stringify(lista))
  } catch {
    // Falha silenciosa
  }
}

export async function buscarDemandasDisponiveis(): Promise<DemandaPublica[]> {
  try {
    // Tenta endpoint geral de demandas caso o backend venha a expor
    const { data } = await api.get<any[]>('/demand')
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item) => ({
        id: item.id,
        company_id: item.company_id || '',
        titulo: item.titulo ?? item.title ?? '',
        descricao: item.descricao ?? item.description ?? '',
        segmento: item.segmento ?? '',
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
        status: item.status ?? item.demand_status ?? 'aberta',
        created_at: item.created_at ?? new Date().toISOString(),
        empresa_nome: item.empresa_nome ?? item.company_name ?? 'Empresa Parceira',
      }))
    }
  } catch {
    // Backend ainda não tem /api/demand público exposto
  }

  return obterDemandasPublicas()
}

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

  const resultado = data.map((item) => {
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

  for (const d of resultado) {
    salvarDemandaPublica(d)
  }

  return resultado
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

  // Coleta apenas UUIDs reais do catálogo (filtrando UUIDs sintéticos de fallback do cliente,
  // pois eles não existem no banco de dados e causariam violação de chave estrangeira 404)
  const segmentosUuid = (dados.segmentIds ?? [])
    .concat(ehUuidReal(dados.segmento) ? [dados.segmento] : [])
    .filter(ehUuidReal)

  const servicosUuid = (dados.serviceIds ?? [])
    .concat(dados.servicos.filter(ehUuidReal))
    .filter(ehUuidReal)

  const tecnologiasUuid = (dados.technologyIds ?? [])
    .concat(dados.tecnologias.filter(ehUuidReal))
    .filter(ehUuidReal)

  const expertisesUuid = (dados.expertiseIds ?? []).filter(ehUuidReal)

  let statusBackend = 'open'
  if (dados.status === 'closed' || dados.status === 'encerrada') {
    statusBackend = 'closed'
  } else if (dados.status === 'canceled' || dados.status === 'cancelada') {
    statusBackend = 'canceled'
  }

  const payload: Record<string, unknown> = {
    // Campos esperados pelo backend Gleam
    title: tituloLimpo,
    description: descricaoLimpa,
    status: statusBackend,
    segments: Array.from(new Set(segmentosUuid)),
    services: Array.from(new Set(servicosUuid)),
    expertises: Array.from(new Set(expertisesUuid)),
    technologies: Array.from(new Set(tecnologiasUuid)),
    // Campos legados para compatibilidade
    titulo: tituloLimpo,
    descricao: descricaoLimpa,
    segmento: dados.segmento,
    servicos: dados.servicos,
    tecnologias: dados.tecnologias,
  }

  let item: any
  try {
    const { data } = await api.post<any>(`/company/${companyId}/demand`, payload)
    item = data.demand ?? data
  } catch (err: unknown) {
    const isMissingEntity =
      axios.isAxiosError(err) &&
      err.response?.status === 404 &&
      (typeof err.response?.data === 'string'
        ? err.response.data.includes('was not found')
        : Boolean(err.response?.data?.message?.includes('was not found')))

    const temAssociacoes =
      (payload.segments as string[]).length > 0 ||
      (payload.services as string[]).length > 0 ||
      (payload.technologies as string[]).length > 0 ||
      (payload.expertises as string[]).length > 0

    if (isMissingEntity && temAssociacoes) {
      // Se alguma entidade do catálogo não existe no banco de dados, cria a demanda sem as associações que falharam
      const payloadLimpo = {
        ...payload,
        segments: [],
        services: [],
        technologies: [],
        expertises: [],
      }
      const { data } = await api.post<any>(`/company/${companyId}/demand`, payloadLimpo)
      item = data.demand ?? data
    } else {
      throw err
    }
  }

  const novaDemanda: Demanda = {
    id: item.id,
    company_id: item.company_id || companyId,
    titulo: item.titulo ?? item.title ?? tituloLimpo,
    descricao: item.descricao ?? item.description ?? descricaoLimpa,
    segmento: dados.segmento,
    servicos: dados.servicos,
    tecnologias: dados.tecnologias,
    status:
      item.status === 'closed' || item.demand_status === 'closed' || dados.status === 'closed' || dados.status === 'encerrada'
        ? 'encerrada'
        : item.status === 'canceled' || item.demand_status === 'canceled' || dados.status === 'canceled' || dados.status === 'cancelada'
          ? 'cancelada'
          : 'aberta',
    created_at: item.created_at ?? new Date().toISOString(),
  }

  salvarDemandaPublica(novaDemanda, (dados as any).empresa_nome)

  return novaDemanda
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
  nomeEmpresa?: string,
): Promise<Demanda> {
  const demandaId = typeof demandaIdOrDados === 'string' ? demandaIdOrDados : companyIdOrDemandaId
  const dados = (typeof demandaIdOrDados === 'string' ? talvezDados : demandaIdOrDados) as AtualizarDemandaPayload

  const tituloLimpo = dados.titulo?.trim()
  const descricaoLimpa = dados.descricao?.trim()

  let statusBackend: string | undefined = undefined
  if (dados.status) {
    if (dados.status === 'aberta') statusBackend = 'open'
    else if (dados.status === 'encerrada') statusBackend = 'closed'
    else if (dados.status === 'cancelada') statusBackend = 'canceled'
    else statusBackend = dados.status
  }

  const payload: Record<string, unknown> = {
    title: tituloLimpo,
    description: descricaoLimpa,
    titulo: tituloLimpo,
    descricao: descricaoLimpa,
    segmento: dados.segmento,
    servicos: dados.servicos,
    tecnologias: dados.tecnologias,
    ...(statusBackend ? { status: statusBackend } : {}),
  }

  const { data } = await api.patch<any>(`/company/demand/${demandaId}`, payload)
  const item = data?.demand ?? data ?? {}

  const atualizada: Demanda = {
    id: item.id ?? demandaId,
    company_id: item.company_id ?? '',
    titulo: item.titulo ?? item.title ?? tituloLimpo ?? '',
    descricao: item.descricao ?? item.description ?? descricaoLimpa ?? '',
    segmento: dados.segmento ?? '',
    servicos: dados.servicos ?? [],
    tecnologias: dados.tecnologias ?? [],
    status: (item.status || item.demand_status || dados.status || 'aberta') as StatusDemanda,
    created_at: item.created_at ?? new Date().toISOString(),
  }

  salvarDemandaPublica(atualizada, nomeEmpresa || (dados as any)?.empresa_nome)

  return atualizada
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
  removerDemandaPublica(demandaId)
}

/**
 * GET /api/company/:companyId/connection
 *
 * Lista as conexões/convites da empresa.
 */
export async function listarConvites(companyId: string): Promise<ConviteReuniao[]> {
  try {
    const { data } = await api.get<any[]>(`/company/${companyId}/connection`, {
      params: { limit: 50, offset: 0 },
    })
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

// ---------------------------------------------------------------------------
// Candidaturas a Demandas (demand_application)
// ---------------------------------------------------------------------------

export type StatusCandidatura = 'pending' | 'accepted' | 'declined'

export type CandidaturaDemanda = {
  demand: string
  startup: string
  status: StatusCandidatura
  created_at: string
  updated_at: string
  startup_nome?: string
  startup_descricao?: string
  startup_cidade?: string
  startup_estado?: string
}

/**
 * POST /api/startup/:id/application
 *
 * Startup se candidata a uma demanda aberta.
 */
export async function candidatarADemanda(
  startupId: string,
  demandId: string,
): Promise<CandidaturaDemanda> {
  const { data } = await api.post<CandidaturaDemanda>(`/startup/${startupId}/application`, {
    demand: demandId,
  })
  return data
}

/**
 * DELETE /api/startup/:id/application/:demand_id
 *
 * Startup cancela / desiste de sua candidatura a uma demanda.
 */
export async function desistirCandidaturaDemanda(
  startupId: string,
  demandId: string,
): Promise<CandidaturaDemanda> {
  const { data } = await api.delete<CandidaturaDemanda>(
    `/startup/${startupId}/application/${demandId}`,
  )
  return data
}

/**
 * GET /api/company/demand/:id/application
 *
 * Lista todas as candidaturas de startups recebidas para uma demanda da empresa.
 */
export async function listarCandidaturasDemanda(
  demandId: string,
): Promise<CandidaturaDemanda[]> {
  const { data } = await api.get<CandidaturaDemanda[]>(
    `/company/demand/${demandId}/application`,
  )
  return Array.isArray(data) ? data : []
}

/**
 * PATCH /api/company/demand/:id/application/:startup_id
 *
 * Empresa aceita ou recusa a candidatura da startup à demanda.
 */
export async function responderCandidaturaDemanda(
  demandId: string,
  startupId: string,
  status: 'accepted' | 'declined',
): Promise<CandidaturaDemanda> {
  const { data } = await api.patch<CandidaturaDemanda>(
    `/company/demand/${demandId}/application/${startupId}`,
    { status },
  )
  return data
}
