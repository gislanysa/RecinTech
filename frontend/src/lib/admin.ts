/**
 * Módulo de Administração do RecInTech (Frontend-only).
 *
 * Gerencia perfil de administrador, métricas globais e moderação de perfis
 * de startups, empresas e administradores sem alterar o backend.
 */
import { obterDemandasReais } from './demandas.ts'

export type Admin = {
  id: string
  name: string
  email: string
  role: 'admin'
  cargo?: string
  is_active: boolean
  created_at: string
}

export type EmpresaAdmin = {
  id: string
  name: string
  email: string
  size: 'micro' | 'small' | 'medium' | 'big'
  cnpj: string
  city: string
  state: string
  website: string
  is_active: boolean
  created_at: string
}

export type StartupAdmin = {
  id: string
  name: string
  email?: string
  initials?: string
  stage?: 'traction' | 'scaling' | (string & {})
  cnpj?: string
  description?: string
  city?: string
  state?: string
  website?: string
  technologies?: string[]
  is_active: boolean
  emDestaque?: boolean
  created_at: string
}

export const CHAVE_SESSAO_ADMIN = 'recintech:sessao_admin'
export const CHAVE_LISTA_ADMINS = 'recintech:admins'
export const CHAVE_LISTA_EMPRESAS_ADMIN = 'recintech:empresas_admin'
export const CHAVE_LISTA_STARTUPS_ADMIN = 'recintech:startups_cadastradas_reais'
export const CHAVE_STATUS_STARTUPS_ADMIN = 'recintech:startups_status_admin'

const ADMINS_INICIAIS: Admin[] = [
  {
    id: 'admin-master',
    name: 'Administrador',
    email: 'admin@recintech.com',
    role: 'admin',
    cargo: 'Gestão e Governança da Plataforma',
    is_active: true,
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'admin-suporte',
    name: 'Suporte Técnico RecInTech',
    email: 'suporte@recintech.com',
    role: 'admin',
    cargo: 'Operações e Atendimento B2B',
    is_active: true,
    created_at: '2026-02-01T00:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// Gestão de Administradores
// ---------------------------------------------------------------------------

export function obterAdmins(): Admin[] {
  if (typeof window === 'undefined') return ADMINS_INICIAIS
  try {
    const raw = localStorage.getItem(CHAVE_LISTA_ADMINS)
    if (!raw) {
      localStorage.setItem(CHAVE_LISTA_ADMINS, JSON.stringify(ADMINS_INICIAIS))
      return ADMINS_INICIAIS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : ADMINS_INICIAIS
  } catch {
    return ADMINS_INICIAIS
  }
}

export function salvarAdmins(admins: Admin[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CHAVE_LISTA_ADMINS, JSON.stringify(admins))
  } catch {
    // falha silenciosa
  }
}

export function adicionarAdmin(dados: {
  name: string
  email: string
  cargo?: string
}): Admin {
  const lista = obterAdmins()
  const emailNormalizado = dados.email.trim().toLowerCase()

  const existe = lista.some((a) => a.email.toLowerCase() === emailNormalizado)
  if (existe) {
    throw new Error('Já existe um administrador cadastrado com este e-mail.')
  }

  const novo: Admin = {
    id: `admin-${Date.now()}`,
    name: dados.name.trim(),
    email: emailNormalizado,
    role: 'admin',
    cargo: dados.cargo?.trim() || 'Gestão da Plataforma',
    is_active: true,
    created_at: new Date().toISOString(),
  }

  lista.unshift(novo)
  salvarAdmins(lista)
  return novo
}

export function alternarStatusAdmin(id: string): Admin {
  const lista = obterAdmins()
  const index = lista.findIndex((a) => a.id === id)
  if (index === -1) {
    throw new Error('Administrador não encontrado.')
  }

  const atual = lista[index]
  // Não permite desativar o admin master principal para não trancar o sistema
  if (atual.id === 'admin-master') {
    throw new Error('O Administrador Master principal não pode ser desativado.')
  }

  const atualizado: Admin = {
    ...atual,
    is_active: !atual.is_active,
  }

  lista[index] = atualizado
  salvarAdmins(lista)
  return atualizado
}

export function atualizarAdmin(id: string, dados: Partial<Admin>): Admin {
  const lista = obterAdmins()
  const index = lista.findIndex((a) => a.id === id)
  if (index === -1) {
    throw new Error('Administrador não encontrado.')
  }

  const atual = lista[index]
  const atualizado: Admin = {
    ...atual,
    ...dados,
    id: atual.id,
    role: 'admin',
  }

  lista[index] = atualizado
  salvarAdmins(lista)

  // Se for o admin logado atualmente, atualiza a sessão
  const sessaoAtual = obterSessaoAdminAtual()
  if (sessaoAtual?.id === id) {
    salvarSessaoAdmin(atualizado)
  }

  return atualizado
}

// ---------------------------------------------------------------------------
// Sessão de Admin (localStorage)
// ---------------------------------------------------------------------------

export function obterSessaoAdminAtual(): Admin | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CHAVE_SESSAO_ADMIN)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.role === 'admin' ? (parsed as Admin) : null
  } catch {
    return null
  }
}

export function salvarSessaoAdmin(admin: Admin): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CHAVE_SESSAO_ADMIN, JSON.stringify(admin))
}

export function limparSessaoAdmin(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CHAVE_SESSAO_ADMIN)
}

/**
 * Autentica o login administrativo no frontend.
 * Aceita qualquer admin ativo registrado em `obterAdmins()`.
 * Senha aceita: qualquer senha com 8 ou mais caracteres (ou 'admin123456').
 */
export function autenticarAdminLocal(email: string, senha: string): Admin {
  const emailNorm = email.trim().toLowerCase()
  if (!emailNorm) {
    throw new Error('Informe o e-mail do administrador.')
  }

  if (senha.length < 8) {
    throw new Error('A senha precisa ter pelo menos 8 caracteres.')
  }

  const lista = obterAdmins()
  let admin = lista.find((a) => a.email.toLowerCase() === emailNorm)

  if (!admin) {
    // Se o email tiver formato de admin e for o primeiro acesso, cria automaticamente
    if (emailNorm.includes('admin') || emailNorm.endsWith('@recintech.com')) {
      admin = adicionarAdmin({
        name: emailNorm.split('@')[0].toUpperCase(),
        email: emailNorm,
        cargo: 'Administrador da Plataforma',
      })
    } else {
      const erro = new Error('Administrador não cadastrado ou credenciais incorretas.')
      ;(erro as unknown as { response: { status: number } }).response = { status: 401 }
      throw erro
    }
  }

  if (!admin.is_active) {
    const erro = new Error('Esta conta de administrador foi desativada.')
    ;(erro as unknown as { response: { status: number } }).response = { status: 401 }
    throw erro
  }

  salvarSessaoAdmin(admin)
  return admin
}

// ---------------------------------------------------------------------------
// Gestão de Empresas e Startups para o Painel do Administrador
// ---------------------------------------------------------------------------

export function obterEmpresasAdmin(): EmpresaAdmin[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CHAVE_LISTA_EMPRESAS_ADMIN)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function salvarEmpresasAdmin(empresas: EmpresaAdmin[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CHAVE_LISTA_EMPRESAS_ADMIN, JSON.stringify(empresas))
  } catch {
    // silencia
  }
}

export function obterStartupsAdmin(): StartupAdmin[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CHAVE_LISTA_STARTUPS_ADMIN)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const list: StartupAdmin[] = Array.isArray(parsed) ? parsed : []
    const statusMap = obterStatusStartupsAdmin()
    return list.map((s) => ({
      ...s,
      is_active: statusMap[s.id]?.is_active !== undefined ? statusMap[s.id].is_active! : s.is_active,
      emDestaque: statusMap[s.id]?.emDestaque !== undefined ? statusMap[s.id].emDestaque! : Boolean(s.emDestaque),
    }))
  } catch {
    return []
  }
}

export function salvarStartupsAdmin(startups: StartupAdmin[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CHAVE_LISTA_STARTUPS_ADMIN, JSON.stringify(startups))
  } catch {
    // silencia
  }
}

export function alternarStatusEmpresaAdmin(id: string): EmpresaAdmin {
  const lista = obterEmpresasAdmin()
  const index = lista.findIndex((e) => e.id === id)
  if (index === -1) throw new Error('Empresa não encontrada.')
  lista[index].is_active = !lista[index].is_active
  salvarEmpresasAdmin(lista)
  return lista[index]
}

export function obterStatusStartupsAdmin(): Record<string, { is_active?: boolean; emDestaque?: boolean }> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(CHAVE_STATUS_STARTUPS_ADMIN)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function salvarStatusStartupAdmin(
  startupId: string,
  alteracoes: { is_active?: boolean; emDestaque?: boolean },
): void {
  if (typeof window === 'undefined') return
  try {
    const todos = obterStatusStartupsAdmin()
    todos[startupId] = { ...todos[startupId], ...alteracoes }
    localStorage.setItem(CHAVE_STATUS_STARTUPS_ADMIN, JSON.stringify(todos))

    // Atualiza também na lista de startups cadastradas
    const raw = localStorage.getItem(CHAVE_LISTA_STARTUPS_ADMIN)
    if (raw) {
      const lista: StartupAdmin[] = JSON.parse(raw)
      const idx = lista.findIndex((s) => s.id === startupId)
      if (idx >= 0) {
        lista[idx] = {
          ...lista[idx],
          is_active: alteracoes.is_active ?? lista[idx].is_active,
          emDestaque: alteracoes.emDestaque ?? lista[idx].emDestaque,
        }
        localStorage.setItem(CHAVE_LISTA_STARTUPS_ADMIN, JSON.stringify(lista))
      }
    }
  } catch {
    // silencia
  }
}

function sincronizarStartupAdminItem(s: Partial<StartupAdmin> & { name?: string; id?: string }): void {
  if (!s.id || !s.name) return
  const lista = obterStartupsAdmin()
  const idx = lista.findIndex((item) => item.id === s.id)
  const statusMap = obterStatusStartupsAdmin()
  const custom = statusMap[s.id]
  const novoItem: StartupAdmin = {
    id: s.id,
    name: s.name,
    initials: s.initials || s.name.substring(0, 2).toUpperCase(),
    stage: s.stage || 'traction',
    city: s.city || 'Recife',
    state: s.state || 'PE',
    technologies: s.technologies || [],
    is_active: custom?.is_active ?? s.is_active ?? true,
    emDestaque: custom?.emDestaque ?? Boolean(s.emDestaque),
    created_at: s.created_at || new Date().toISOString(),
  }
  if (idx >= 0) {
    lista[idx] = { ...lista[idx], ...novoItem }
  } else {
    lista.push(novoItem)
  }
  salvarStartupsAdmin(lista)
}

function sincronizarEmpresaAdminItem(e: Partial<EmpresaAdmin> & { name?: string; id?: string }): void {
  if (!e.id || !e.name) return
  const lista = obterEmpresasAdmin()
  const idx = lista.findIndex((item) => item.id === e.id)
  const novoItem: EmpresaAdmin = {
    id: e.id,
    name: e.name,
    size: (e.size as EmpresaAdmin['size']) || 'medium',
    cnpj: e.cnpj || '',
    city: e.city || 'Recife',
    state: e.state || 'PE',
    email: e.email || '',
    website: e.website || '',
    is_active: e.is_active ?? true,
    created_at: e.created_at || new Date().toISOString(),
  }
  if (idx >= 0) {
    lista[idx] = { ...lista[idx], ...novoItem }
  } else {
    lista.push(novoItem)
  }
  salvarEmpresasAdmin(lista)
}

export function sincronizarContaAdmin(conta: unknown): void {
  if (!conta || typeof conta !== 'object') return
  try {
    if ('stage' in conta) {
      sincronizarStartupAdminItem(conta as Partial<StartupAdmin> & { name?: string; id?: string })
    } else if ('size' in conta) {
      sincronizarEmpresaAdminItem(conta as Partial<EmpresaAdmin> & { name?: string; id?: string })
    }
  } catch {
    // silencia
  }
}

// ---------------------------------------------------------------------------
// Contratações Reais de Pacotes de Monetização (Sem dados simulados)
// ---------------------------------------------------------------------------

export const CHAVE_CONTRATACOES_STARTUPS = 'recintech:planos_destaque_contratados'
export const CHAVE_CONTRATACOES_EMPRESAS = 'recintech:desbloqueios_contratados'

export function obterContratacoesStartups(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CHAVE_CONTRATACOES_STARTUPS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function registrarContratacaoPlanoDestaque(startupId: string): void {
  if (typeof window === 'undefined') return
  try {
    const contratados = obterContratacoesStartups()
    if (!contratados.includes(startupId)) {
      contratados.push(startupId)
      localStorage.setItem(CHAVE_CONTRATACOES_STARTUPS, JSON.stringify(contratados))
    }
  } catch {
    // silencia
  }
}

export function obterContratacoesEmpresas(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CHAVE_CONTRATACOES_EMPRESAS)
    const list = raw ? JSON.parse(raw) : []
    const resultado = Array.isArray(list) ? list : []
    // Verifica se houve confirmação direta de desbloqueio
    if (resultado.length === 0 && localStorage.getItem('recintech:desbloqueio_recomendacoes') === 'true') {
      resultado.push('empresa-sessao-atual')
    }
    return resultado
  } catch {
    return []
  }
}

export function registrarContratacaoDesbloqueio(empresaId?: string): void {
  if (typeof window === 'undefined') return
  try {
    const list = obterContratacoesEmpresas()
    const id = empresaId || 'empresa-sessao-atual'
    if (!list.includes(id)) {
      list.push(id)
      localStorage.setItem(CHAVE_CONTRATACOES_EMPRESAS, JSON.stringify(list))
    }
  } catch {
    // silencia
  }
}

// ---------------------------------------------------------------------------
// Métricas Globais da Plataforma (Rubrica 3.6 / Dashboard do Admin)
// ---------------------------------------------------------------------------

export type MetricasPlataforma = {
  totalStartups: number
  startupsAtivas: number
  startupsDestaque: number
  totalEmpresas: number
  empresasAtivas: number
  totalDemandas: number
  demandasAbertas: number
  volumeFinanceiroTotal: number
  totalAdmins: number
  taxaConversaoMatches: number
  pacotesDestaqueContratados: number
  pacotesDesbloqueioContratados: number
}

export function calcularMetricasGlobais(): MetricasPlataforma {
  const startups = obterStartupsAdmin()
  const statusStartups = obterStatusStartupsAdmin()
  const empresas = obterEmpresasAdmin()
  const demandas = obterDemandasReais()
  const admins = obterAdmins()
  const contratacoesStartups = obterContratacoesStartups()
  const contratacoesEmpresas = obterContratacoesEmpresas()

  let startupsAtivas = 0
  let startupsDestaque = 0

  for (const s of startups) {
    const mod = statusStartups[s.id]
    const ativo = mod?.is_active ?? s.is_active
    const destaque =
      mod?.emDestaque ?? (contratacoesStartups.includes(s.id) || Boolean(s.emDestaque))
    if (ativo) startupsAtivas++
    if (destaque) startupsDestaque++
  }

  const empresasAtivas = empresas.filter((e) => e.is_active).length
  const demandasAbertas = demandas.filter((d) => d.status === 'aberta' || d.status === 'open').length
  const volumeFinanceiroTotal = demandas.reduce((acc, d) => {
    return acc + (typeof d.orcamento === 'number' ? d.orcamento : 0)
  }, 0)
  const taxaConversaoMatches =
    demandas.length > 0 ? Math.min(100, Math.round((demandasAbertas / demandas.length) * 100)) : 0

  return {
    totalStartups: startups.length,
    startupsAtivas,
    startupsDestaque,
    totalEmpresas: empresas.length,
    empresasAtivas,
    totalDemandas: demandas.length,
    demandasAbertas,
    volumeFinanceiroTotal,
    totalAdmins: admins.length,
    taxaConversaoMatches,
    pacotesDestaqueContratados: contratacoesStartups.length,
    pacotesDesbloqueioContratados: contratacoesEmpresas.length,
  }
}
