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

/**
 * GET /startup (lista pública, sem autenticação).
 *
 * TODO (backend): rota ainda não existe — hoje só há `GET /api/startup/:id`
 * (ver `web.gleam`). Quando existir, o formato esperado por esta função é:
 * ```json
 * [{ "id", "name", "stage", "cnpj", "description", "city", "state",
 *    "created_at", "area", "services": [], "technologies": [],
 *    "segments": [] }, ...]
 * ```
 * `area`/`services`/`segments` batem com as entidades `expertise`, `service`
 * e `segment` já modeladas no banco; `technologies` não tem tabela — se o
 * time decidir não criar uma, essa faceta fica só no front por enquanto.
 *
 * Até a rota existir, cai silenciosamente para `STARTUPS_MOCK` — a tela
 * funciona local e "liga sozinha" assim que o back responder.
 */
export async function listarStartups(): Promise<StartupCatalogo[]> {
  try {
    const { data } = await api.get<StartupCatalogo[]>('/startup')
    return data
  } catch {
    return STARTUPS_MOCK
  }
}