import type { Startup } from '@/lib/api.ts'
import { carregarCanvas, temConteudo, type CanvasStartup } from '@/lib/canvas.ts'
import { carregarTagsDaStartup } from '@/lib/startups.ts'

/** Dias sem atualizar o perfil a partir dos quais o alerta aparece. */
export const DIAS_PARA_PERFIL_DESATUALIZADO = 90

export type Tags = Awaited<ReturnType<typeof carregarTagsDaStartup>>

export type ItemSaude = {
  chave: string
  rotulo: string
  preenchido: boolean
  /** O que fazer para preencher, escrito como instrução clara. */
  comoPreencher: string
  /** Verbo padronizado do botão de ação. */
  acao: string
  /** `true` pois todos os itens podem ser preenchidos diretamente na tela de Meu Perfil. */
  disponivel: boolean
  /** Rota com âncora para ir direto à seção correspondente. */
  rota?: string
}

/** Texto e verbo padronizado de cada item da tela de Meu Perfil. */
const COMO_PREENCHER: Record<string, { comoPreencher: string; acao: string; disponivel: boolean; rota?: string }> = {
  description: {
    comoPreencher: 'Preencher a descrição da sua startup',
    acao: 'Preencher',
    disponivel: true,
    rota: '/dashboard/startup/perfil#cadastro',
  },
  website: {
    comoPreencher: 'Preencher o site ou rede social da sua startup',
    acao: 'Preencher',
    disponivel: true,
    rota: '/dashboard/startup/perfil#cadastro',
  },
  location: {
    comoPreencher: 'Preencher a localização (cidade e estado) onde atua',
    acao: 'Preencher',
    disponivel: true,
    rota: '/dashboard/startup/perfil#cadastro',
  },
  area: {
    comoPreencher: 'Preencher a área de atuação principal',
    acao: 'Preencher',
    disponivel: true,
    rota: '/dashboard/startup/perfil#tags',
  },
  services: {
    comoPreencher: 'Preencher os serviços que sua startup oferece',
    acao: 'Preencher',
    disponivel: true,
    rota: '/dashboard/startup/perfil#tags',
  },
  technologies: {
    comoPreencher: 'Preencher as tecnologias utilizadas pela sua startup',
    acao: 'Preencher',
    disponivel: true,
    rota: '/dashboard/startup/perfil#tags',
  },
  segments: {
    comoPreencher: 'Preencher os segmentos de mercado atendidos',
    acao: 'Preencher',
    disponivel: true,
    rota: '/dashboard/startup/perfil#tags',
  },
  canvas: {
    comoPreencher: 'Preencher o Business Model Canvas da sua startup',
    acao: 'Preencher',
    disponivel: true,
    rota: '/dashboard/startup/perfil#canvas',
  },
}

export type SaudeDoPerfil = {
  /** 0–100 */
  porcentagem: number
  itens: ItemSaude[]
  faltando: ItemSaude[]
}

/**
 * Campos considerados para a saúde do perfil: baseados exatamente nas
 * informações que constam na tela de Meu Perfil da startup:
 * - Dados do cadastro (descrição, site, localização)
 * - Áreas, serviços e tecnologias (área principal, serviços, tecnologias, segmentos)
 * - Business Model Canvas (blocos do modelo de negócio)
 */
export function calcularSaudeDoPerfil(
  startup: Startup,
  tags: Tags | null,
  canvas?: CanvasStartup | null,
): SaudeDoPerfil {
  const preenchido = (valor: string | undefined) => !!valor && valor.trim().length > 0
  const dadosCanvas = canvas !== undefined ? canvas : startup.id ? carregarCanvas(startup.id) : null

  const base: { chave: string; rotulo: string; preenchido: boolean }[] = [
    { chave: 'description', rotulo: 'Descrição', preenchido: preenchido(startup.description) },
    { chave: 'area', rotulo: 'Área de atuação', preenchido: preenchido(tags?.area) },
    { chave: 'services', rotulo: 'Serviços', preenchido: (tags?.services.length ?? 0) > 0 },
    { chave: 'technologies', rotulo: 'Tecnologias', preenchido: (tags?.technologies.length ?? 0) > 0 },
    { chave: 'segments', rotulo: 'Segmentos', preenchido: (tags?.segments.length ?? 0) > 0 },
    { chave: 'website', rotulo: 'Site', preenchido: preenchido(startup.website) },
    { chave: 'location', rotulo: 'Localização', preenchido: preenchido(startup.city) && preenchido(startup.state) },
    { chave: 'canvas', rotulo: 'Business Model Canvas', preenchido: dadosCanvas ? temConteudo(dadosCanvas) : false },
  ]

  const itens: ItemSaude[] = base.map((item) => ({ ...item, ...COMO_PREENCHER[item.chave] }))

  const feitos = itens.filter((item) => item.preenchido).length
  return {
    porcentagem: Math.round((feitos / itens.length) * 100),
    itens,
    faltando: itens.filter((item) => !item.preenchido),
  }
}

const MS_POR_DIA = 24 * 60 * 60 * 1000

/**
 * Dias desde a última atualização do perfil, ou `null` quando o backend não
 * informou a data (hoje não informa — ver `Startup.updated_at`). Nesse caso a
 * tela não exibe o alerta, em vez de inventar uma data.
 */
export function diasSemAtualizar(startup: Startup, agora: Date = new Date()): number | null {
  if (!startup.updated_at) return null
  const data = new Date(startup.updated_at)
  if (Number.isNaN(data.getTime())) return null
  return Math.floor((agora.getTime() - data.getTime()) / MS_POR_DIA)
}
