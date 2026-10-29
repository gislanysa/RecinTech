/**
 * Oportunidades recomendadas para a startup.
 *
 * O BACKEND AINDA NÃO TEM suporte a isto. Rotas existentes em `web.gleam`:
 * nada de oportunidades, demandas de empresa, compatibilidade/matchmaking ou
 * manifestação de interesse. Também não há campo de "demanda" na tabela de
 * empresas. Por isso, e seguindo o padrão de `STARTUPS_MOCK` em `startups.ts`,
 * esta tela usa DADOS SIMULADOS — e a interface avisa isso ao usuário
 * (`origem: 'simulado'`).
 *
 * Quando o backend expuser os endpoints, só as três funções exportadas abaixo
 * (`listarOportunidades`, `manifestarInteresse`, `ignorarOportunidade`) precisam
 * mudar; os componentes continuam iguais. Nenhuma chamada HTTP é feita aqui de
 * propósito, para não depender de endpoints que não existem.
 */
export type Oportunidade = {
  id: string
  empresa: string
  demanda: string
  /** 0–100. Valor simulado enquanto o cálculo de matchmaking não existe. */
  compatibilidade: number
  tecnologias: string[]
}

export type OrigemDosDados = 'api' | 'simulado'

export const OPORTUNIDADES_SIMULADAS: Oportunidade[] = [
  {
    id: 'sim-1',
    empresa: 'Grupo Atlântico Logística',
    demanda: 'Plataforma de roteirização inteligente para reduzir o custo de entregas de última milha.',
    compatibilidade: 92,
    tecnologias: ['Python', 'AWS'],
  },
  {
    id: 'sim-2',
    empresa: 'Rede Clínica Vida',
    demanda: 'Automação do agendamento e da triagem de pacientes com atendimento por IA.',
    compatibilidade: 85,
    tecnologias: ['Inteligência Artificial', 'Node.js'],
  },
  {
    id: 'sim-3',
    empresa: 'Mercantil Nordeste',
    demanda: 'Painel de análise de dados de vendas para as lojas físicas e o e-commerce.',
    compatibilidade: 78,
    tecnologias: ['PostgreSQL', 'React'],
  },
  {
    id: 'sim-4',
    empresa: 'Construtora Horizonte',
    demanda: 'Aplicativo mobile para acompanhamento de obras e relatórios de campo.',
    compatibilidade: 64,
    tecnologias: ['React Native', 'TypeScript'],
  },
]

const atraso = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** TODO(backend): trocar por GET de oportunidades quando existir. */
/**
 * Uma conexão entre startup e empresa.
 *
 * Modelo único para as duas direções: quando a startup clica em "Tenho
 * interesse" nasce com `iniciado_por: 'startup'`; quando a empresa convida,
 * com `'company'`. O "match" é o status virando `aceito`.
 *
 * NENHUMA ROTA DISSO EXISTE AINDA. O contrato proposto é:
 *   POST  /api/connection
 *   GET   /api/startup/:id/connection
 *   GET   /api/company/:id/connection
 *   PATCH /api/connection/:id
 */
export type StatusConexao = 'pendente' | 'aceito' | 'recusado'

export type Conexao = {
  id: string
  oportunidade: Oportunidade
  iniciado_por: 'startup' | 'company'
  status: StatusConexao
  created_at: string
  /** Preenchido quando a empresa responde. */
  respondido_em?: string
}

/**
 * Enquanto o backend não existe, as conexões vivem em memória.
 *
 * Isso some ao recarregar a página, e é de propósito: guardar no navegador
 * daria a impressão de que algo foi gravado de verdade, quando a empresa do
 * outro lado nunca fica sabendo.
 */
const CONEXOES_SIMULADAS: Conexao[] = [
  {
    id: 'cnx-exemplo-1',
    oportunidade: {
      id: 'sim-4',
      empresa: 'Hospital Santa Clara',
      demanda: 'Portal de agendamento online integrado ao sistema de prontuário.',
      compatibilidade: 88,
      tecnologias: ['React', 'Node.js'],
    },
    iniciado_por: 'startup',
    status: 'aceito',
    created_at: '2026-10-18T14:00:00Z',
    respondido_em: '2026-10-20T09:30:00Z',
  },
  {
    id: 'cnx-exemplo-2',
    oportunidade: {
      id: 'sim-5',
      empresa: 'Rede Mercadão Nordeste',
      demanda: 'Aplicativo mobile para gerenciamento de pedidos das lojas.',
      compatibilidade: 86,
      tecnologias: ['React Native', 'PostgreSQL'],
    },
    iniciado_por: 'startup',
    status: 'pendente',
    created_at: '2026-10-21T16:20:00Z',
  },
]

/** Ids que já viraram conexão e por isso saem das recomendações. */
const inscritas = new Set(CONEXOES_SIMULADAS.map((c) => c.oportunidade.id))

/**
 * GET /startup/:id/connection — quando existir.
 *
 * Lista o que a startup já se inscreveu, com a resposta da empresa.
 */
export async function listarConexoes(): Promise<{
  conexoes: Conexao[]
  origem: OrigemDosDados
}> {
  await atraso(500)
  return { conexoes: [...CONEXOES_SIMULADAS], origem: 'simulado' }
}

export async function listarOportunidades(): Promise<{
  oportunidades: Oportunidade[]
  origem: OrigemDosDados
}> {
  await atraso(600)
  // O que já virou conexão sai da lista de descoberta: quem já demonstrou
  // interesse acompanha em Conexões, não volta a ver a mesma demanda aqui.
  return {
    oportunidades: OPORTUNIDADES_SIMULADAS.filter((o) => !inscritas.has(o.id)),
    origem: 'simulado',
  }
}

/**
 * POST /connection — quando existir.
 *
 * Cria a conexão com `iniciado_por: 'startup'` e status `pendente`, à espera
 * da resposta da empresa.
 */
export async function manifestarInteresse(oportunidadeId: string): Promise<void> {
  await atraso(700)
  const oportunidade = OPORTUNIDADES_SIMULADAS.find((o) => o.id === oportunidadeId)
  if (!oportunidade || inscritas.has(oportunidadeId)) return

  inscritas.add(oportunidadeId)
  CONEXOES_SIMULADAS.unshift({
    id: `cnx-${oportunidadeId}`,
    oportunidade,
    iniciado_por: 'startup',
    status: 'pendente',
    created_at: new Date().toISOString(),
  })
}

/** TODO(backend): persistir o "ignorar" quando existir; por ora só some da lista. */
export async function ignorarOportunidade(oportunidadeId: string): Promise<void> {
  await atraso(300)
  inscritas.add(oportunidadeId)
}
