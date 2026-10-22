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
export async function listarOportunidades(): Promise<{
  oportunidades: Oportunidade[]
  origem: OrigemDosDados
}> {
  await atraso(600)
  return { oportunidades: OPORTUNIDADES_SIMULADAS, origem: 'simulado' }
}

/** TODO(backend): trocar por POST de manifestação de interesse quando existir. */
export async function manifestarInteresse(_oportunidadeId: string): Promise<void> {
  await atraso(700)
}

/** TODO(backend): persistir o "ignorar" quando existir; por ora só some da lista. */
export async function ignorarOportunidade(_oportunidadeId: string): Promise<void> {
  await atraso(300)
}
