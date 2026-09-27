import { api, type Startup as StartupReal } from '@/lib/api.ts'

/**
 * Modelo de "catálogo" de startup — o que a tela de exploração precisa pra
 * exibir e filtrar cards.
 *
 * `StartupReal` (api.ts) é o contrato que o backend já implementa hoje:
 * id, name, stage, cnpj, description, city, state, created_at. Os campos
 * abaixo (area, services, technologies, segments, tagline...) ainda não
 * existem no banco — no schema atual (`postgres/00_tables.sql`) só
 * `expertise`, `service` e `segment` têm tabela própria; `technologies` não
 * tem nenhuma. Ou seja: quando o back expuser `GET /startup`, o retorno
 * provavelmente vai vir com nomes diferentes desses (`expertises`,
 * `services`, `segments` como listas de `{id, name, description}`) — este
 * tipo é o alvo de UX, não o contrato definitivo. Ajuste `mapearStartup`
 * abaixo quando o formato real chegar.
 */
export type StartupCatalogo = StartupReal & {
  slug: string
  initials: string
  area: string
  tagline: string
  services: string[]
  /** Sem tabela no banco ainda — ver comentário acima. */
  technologies: string[]
  segments: string[]
  remote: boolean
  onsite: boolean
  site?: string
  relevance: number
}

export const AREAS = [
  'Tecnologia',
  'Saúde',
  'Educação',
  'Finanças',
  'Marketing',
  'Varejo',
  'Sustentabilidade',
  'Outros',
] as const

export const SERVICES = [
  'Desenvolvimento Web',
  'Desenvolvimento Mobile',
  'UX/UI Design',
  'Inteligência Artificial',
  'Automação',
  'Análise de Dados',
  'Marketing Digital',
  'Consultoria',
  'Outros',
] as const

export const TECHNOLOGIES = [
  'React',
  'React Native',
  'Node.js',
  'Python',
  'Java',
  'JavaScript',
  'TypeScript',
  'PostgreSQL',
  'MySQL',
  'AWS',
  'Docker',
  'Outras',
] as const

/** Mesma lista usada no cadastro (`FormularioStartup.tsx`) — não duplicar aqui, importar de lá quando o valor virar compartilhado. */
export const SEGMENTS = [
  'Agritech',
  'Cleantech / Sustentabilidade',
  'Edtech',
  'Fintech',
  'Healthtech / Medtech',
  'Legaltech',
  'Logtech',
  'Marketplace',
  'Proptech',
  'Retailtech',
  'Saas / Software',
  'Segurança da Informação',
  'Inteligência Artificial',
  'Outro',
] as const

export const STATES = ['PE', 'SP', 'SC', 'RJ', 'MG', 'RS', 'CE', 'PR'] as const

/**
 * Dado provisório enquanto `GET /startup` não existe de verdade no back
 * (hoje só `GET /api/startup/:id` está implementado — ver README/backend).
 * `listarStartups` tenta a chamada real primeiro e cai pra isto se falhar,
 * então a tela já funciona local e também "liga sozinha" assim que o
 * endpoint subir.
 */
export const STARTUPS_MOCK: StartupCatalogo[] = [
  {
    id: 'inova-ai',
    slug: 'inova-ai',
    name: 'InovaAI',
    initials: 'IA',
    area: 'Tecnologia',
    tagline: 'Modelos de IA aplicados a atendimento, previsão de demanda e automação de processos.',
    description: '',
    stage: 'growth',
    cnpj: '',
    services: ['Inteligência Artificial', 'Automação', 'Análise de Dados', 'Consultoria'],
    technologies: ['Python', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker'],
    segments: ['Inteligência Artificial', 'Saas / Software'],
    city: 'Recife',
    state: 'PE',
    remote: true,
    onsite: true,
    site: 'https://inovaai.com.br',
    created_at: '2026-08-20',
    relevance: 98,
  },
  {
    id: 'mobilize-labs',
    slug: 'mobilize-labs',
    name: 'Mobilize Labs',
    initials: 'ML',
    area: 'Tecnologia',
    tagline: 'Estúdio de produtos mobile de alta performance para apps com milhões de acessos.',
    description: '',
    stage: 'growth',
    cnpj: '',
    services: ['Desenvolvimento Mobile', 'UX/UI Design', 'Desenvolvimento Web'],
    technologies: ['React Native', 'TypeScript', 'Node.js', 'AWS'],
    segments: ['Retailtech', 'Saas / Software'],
    city: 'São Paulo',
    state: 'SP',
    remote: true,
    onsite: true,
    created_at: '2026-09-02',
    relevance: 95,
  },
  {
    id: 'vita-healthtech',
    slug: 'vita-healthtech',
    name: 'Vita HealthTech',
    initials: 'VH',
    area: 'Saúde',
    tagline: 'Plataformas de telessaúde e prontuário inteligente para clínicas e operadoras.',
    description: '',
    stage: 'seed',
    cnpj: '',
    services: ['Desenvolvimento Web', 'Inteligência Artificial', 'Consultoria'],
    technologies: ['Node.js', 'React', 'PostgreSQL', 'Docker'],
    segments: ['Healthtech / Medtech', 'Saas / Software'],
    city: 'Florianópolis',
    state: 'SC',
    remote: true,
    onsite: false,
    created_at: '2026-07-11',
    relevance: 91,
  },
  {
    id: 'credmatch',
    slug: 'credmatch',
    name: 'CredMatch',
    initials: 'CM',
    area: 'Finanças',
    tagline: 'Motores de crédito, antifraude e open finance como serviço.',
    description: '',
    stage: 'growth',
    cnpj: '',
    services: ['Inteligência Artificial', 'Análise de Dados', 'Desenvolvimento Web', 'Automação'],
    technologies: ['Java', 'Python', 'PostgreSQL', 'AWS', 'Docker'],
    segments: ['Fintech', 'Saas / Software'],
    city: 'São Paulo',
    state: 'SP',
    remote: true,
    onsite: false,
    created_at: '2026-06-30',
    relevance: 89,
  },
  {
    id: 'aprende-mais',
    slug: 'aprende-mais',
    name: 'AprendeMais',
    initials: 'AM',
    area: 'Educação',
    tagline: 'Plataformas de aprendizagem adaptativa para escolas e universidades corporativas.',
    description: '',
    stage: 'seed',
    cnpj: '',
    services: ['Desenvolvimento Web', 'UX/UI Design', 'Análise de Dados'],
    technologies: ['React', 'Node.js', 'MySQL', 'JavaScript'],
    segments: ['Edtech', 'Saas / Software'],
    city: 'Recife',
    state: 'PE',
    remote: true,
    onsite: true,
    created_at: '2026-09-10',
    relevance: 84,
  },
  {
    id: 'dataforge',
    slug: 'dataforge',
    name: 'DataForge',
    initials: 'DF',
    area: 'Tecnologia',
    tagline: 'Engenharia de dados, data lakes e analytics self-service.',
    description: '',
    stage: 'growth',
    cnpj: '',
    services: ['Análise de Dados', 'Automação', 'Consultoria'],
    technologies: ['Python', 'PostgreSQL', 'AWS', 'Docker', 'TypeScript'],
    segments: ['Saas / Software'],
    city: 'Porto Alegre',
    state: 'RS',
    remote: true,
    onsite: false,
    created_at: '2026-07-29',
    relevance: 86,
  },
]

/** Formato de segmento, serviço, área de atuação e tecnologia no backend. */
type ItemNomeado = {
  id: string
  name: string
  description: string
}

/**
 * As quatro rotas de tag seguem o mesmo padrão: `/api/startup/<recurso>/:id`,
 * e todas devolvem uma lista de `{ id, name, description }`.
 */
const RECURSOS_DE_TAG = {
  segment: 'segments',
  service: 'services',
  expertise: 'expertises',
  technology: 'technologies',
} as const

type Tags = {
  area: string
  services: string[]
  technologies: string[]
  segments: string[]
}

const SEM_TAGS: Tags = { area: '', services: [], technologies: [], segments: [] }

/** Iniciais para o avatar do card: "Mobilize Labs" -> "ML". */
function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0] ?? '')
    .join('')
    .toUpperCase()
}

function paraSlug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Converte a startup crua da API no modelo que a tela usa.
 *
 * `remote`, `onsite` e `relevance` não existem no backend — são campos só de
 * UX. Enquanto não houver origem para eles, `remote`/`onsite` ficam `true`
 * para a startup não sumir de nenhum filtro, e `relevance` fica 0, o que faz
 * a ordenação padrão preservar a ordem devolvida pela API.
 */
function paraCatalogo(startup: StartupReal): StartupCatalogo {
  return {
    ...startup,
    slug: paraSlug(startup.name),
    initials: iniciais(startup.name),
    tagline: startup.description,
    remote: true,
    onsite: true,
    relevance: 0,
    ...SEM_TAGS,
  }
}

/**
 * GET /startup?limit=&offset= — lista pública, sem autenticação.
 *
 * `limit` e `offset` são **obrigatórios**: sem eles o backend responde erro
 * (ver `get_many_startups` em `web.gleam`).
 */
async function buscarStartups(limit: number, offset: number): Promise<StartupReal[]> {
  const { data } = await api.get<StartupReal[]>('/startup', { params: { limit, offset } })
  return data
}

/**
 * Busca as tags de uma startup nas quatro rotas, em paralelo.
 *
 * O backend manteve um endpoint por tabela de propósito: numa resposta única,
 * uma consulta que falhasse derrubaria o card inteiro. Aqui cada recurso que
 * falhar vira lista vazia e os outros continuam valendo.
 *
 * `expertise` (área de atuação) vira o campo `area`, que a tela trata como um
 * valor só — usamos a primeira da lista.
 */
export async function carregarTagsDaStartup(id: string): Promise<Tags> {
  const chaves = Object.keys(RECURSOS_DE_TAG) as (keyof typeof RECURSOS_DE_TAG)[]

  const respostas = await Promise.all(
    chaves.map(async (recurso) => {
      try {
        const { data } = await api.get<ItemNomeado[]>(`/startup/${recurso}/${id}`)
        return data.map((item) => item.name)
      } catch {
        return []
      }
    }),
  )

  const porRecurso = Object.fromEntries(
    chaves.map((recurso, indice) => [RECURSOS_DE_TAG[recurso], respostas[indice]]),
  ) as Record<(typeof RECURSOS_DE_TAG)[keyof typeof RECURSOS_DE_TAG], string[]>

  return {
    area: porRecurso.expertises[0] ?? '',
    services: porRecurso.services,
    technologies: porRecurso.technologies,
    segments: porRecurso.segments,
  }
}

type OpcoesDeListagem = {
  limit?: number
  offset?: number
  /**
   * Chamado uma vez por startup, assim que as tags dela chegam. É o que
   * permite a tela pintar os cards primeiro e completá-los depois, como no
   * diagrama de sequência do backend.
   */
  aoAtualizar?: (startup: StartupCatalogo) => void
}

/**
 * Lista as startups e dispara o enriquecimento em segundo plano.
 *
 * A promessa resolve com os dados básicos — as tags chegam depois, via
 * `aoAtualizar`. Se a lista falhar (backend fora do ar), cai em
 * `STARTUPS_MOCK` e nenhuma requisição de tag é disparada.
 */
export async function listarStartups(
  opcoes: OpcoesDeListagem = {},
): Promise<StartupCatalogo[]> {
  const { limit = 24, offset = 0, aoAtualizar } = opcoes

  let cruas: StartupReal[]
  try {
    cruas = await buscarStartups(limit, offset)
  } catch {
    return STARTUPS_MOCK
  }

  const startups = cruas.map(paraCatalogo)

  if (aoAtualizar) {
    for (const startup of startups) {
      void carregarTagsDaStartup(startup.id).then((tags) =>
        aoAtualizar({ ...startup, ...tags }),
      )
    }
  }

  return startups
}
