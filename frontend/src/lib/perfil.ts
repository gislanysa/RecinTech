import type { Startup } from '@/lib/api.ts'
import { carregarTagsDaStartup } from '@/lib/startups.ts'

/** Dias sem atualizar o perfil a partir dos quais o alerta aparece. */
export const DIAS_PARA_PERFIL_DESATUALIZADO = 90

export type Tags = Awaited<ReturnType<typeof carregarTagsDaStartup>>

export type ItemSaude = {
  chave: string
  rotulo: string
  preenchido: boolean
  /** O que fazer para preencher, escrito como instrução. */
  comoPreencher: string
  /** Verbo do botão de ação. */
  acao: string
  /**
   * `true` quando o campo pode ser preenchido hoje. As quatro tags têm rota de
   * atribuição no backend (`POST /api/startup/<recurso>`); os campos do
   * cadastro não têm rota de alteração, então ainda não há como mexer neles.
   */
  disponivel: boolean
}

/** Texto e verbo de cada item, na ordem em que fazem sentido para quem lê. */
const COMO_PREENCHER: Record<string, { comoPreencher: string; acao: string; disponivel: boolean }> = {
  description: { comoPreencher: 'Escreva o que sua startup faz, em poucas linhas', acao: 'Escrever', disponivel: false },
  website: { comoPreencher: 'Informe o site ou uma rede social da startup', acao: 'Informar', disponivel: false },
  city: { comoPreencher: 'Informe a cidade onde a startup atua', acao: 'Informar', disponivel: false },
  state: { comoPreencher: 'Informe o estado onde a startup atua', acao: 'Informar', disponivel: false },
  stage: { comoPreencher: 'Diga em que estágio a startup está', acao: 'Informar', disponivel: false },
  cnpj: { comoPreencher: 'Informe o CNPJ da startup', acao: 'Informar', disponivel: false },
  area: { comoPreencher: 'Defina sua área de atuação principal', acao: 'Definir', disponivel: true },
  services: { comoPreencher: 'Marque os serviços que vocês entregam', acao: 'Marcar', disponivel: true },
  technologies: { comoPreencher: 'Liste as tecnologias que vocês usam', acao: 'Listar', disponivel: true },
  segments: { comoPreencher: 'Escolha os segmentos de mercado que atende', acao: 'Escolher', disponivel: true },
}

export type SaudeDoPerfil = {
  /** 0–100 */
  porcentagem: number
  itens: ItemSaude[]
  faltando: ItemSaude[]
}

/**
 * Campos considerados "relevantes" para o perfil: os do cadastro
 * (`POST /startup`) mais as tags (serviços, tecnologias, segmentos e área de
 * atuação), que o dashboard busca nas rotas `/startup/:id/<recurso>`.
 * Todos têm o mesmo peso.
 */
export function calcularSaudeDoPerfil(startup: Startup, tags: Tags | null): SaudeDoPerfil {
  const preenchido = (valor: string | undefined) => !!valor && valor.trim().length > 0

  const base: { chave: string; rotulo: string; preenchido: boolean }[] = [
    { chave: 'description', rotulo: 'Descrição', preenchido: preenchido(startup.description) },
    { chave: 'area', rotulo: 'Área de atuação', preenchido: preenchido(tags?.area) },
    { chave: 'services', rotulo: 'Serviços', preenchido: (tags?.services.length ?? 0) > 0 },
    { chave: 'technologies', rotulo: 'Tecnologias', preenchido: (tags?.technologies.length ?? 0) > 0 },
    { chave: 'segments', rotulo: 'Segmentos', preenchido: (tags?.segments.length ?? 0) > 0 },
    { chave: 'website', rotulo: 'Site', preenchido: preenchido(startup.website) },
    { chave: 'city', rotulo: 'Cidade', preenchido: preenchido(startup.city) },
    { chave: 'state', rotulo: 'Estado', preenchido: preenchido(startup.state) },
    { chave: 'stage', rotulo: 'Estágio', preenchido: preenchido(startup.stage) },
    { chave: 'cnpj', rotulo: 'CNPJ', preenchido: preenchido(startup.cnpj) },
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
