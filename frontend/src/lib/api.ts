import axios from 'axios'

/**
 * Cliente HTTP da API em Gleam.
 *
 * No dev o Vite faz proxy de `/api` para `http://localhost:8000` (ver
 * `vite.config.ts`), então não há CORS. Em produção defina `VITE_API_URL`.
 *
 * `withCredentials: true` garante que o browser envie e receba o cookie
 * de sessão automaticamente em todas as requisições.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ---------------------------------------------------------------------------
// Interceptor de Sessão Expirada (401)
// ---------------------------------------------------------------------------

type CallbackSessaoExpirada = () => void
const callbacksSessaoExpirada = new Set<CallbackSessaoExpirada>()

/**
 * Registra um callback para ser acionado quando a API retornar 401 (sessão expirada).
 * Retorna uma função de desinscrição.
 */
export function aoExpirarSessao(callback: CallbackSessaoExpirada): () => void {
  callbacksSessaoExpirada.add(callback)
  return () => {
    callbacksSessaoExpirada.delete(callback)
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url || ''
      // Ignora rotas onde 401 é a resposta esperada para credenciais inválidas ou restore
      const rotasIgnoradas = ['/auth/login', '/auth/restore']
      const ehRotaIgnorada = rotasIgnoradas.some((rota) => url.includes(rota))

      if (!ehRotaIgnorada) {
        callbacksSessaoExpirada.forEach((cb) => {
          try {
            cb()
          } catch {
            // Silencia
          }
        })

        // Redireciona para /entrar caso o usuário esteja em uma página protegida
        if (
          typeof window !== 'undefined' &&
          window.location &&
          !window.location.pathname.startsWith('/entrar') &&
          !window.location.pathname.startsWith('/cadastro')
        ) {
          window.location.href = '/entrar'
        }
      }
    }
    return Promise.reject(error)
  },
)

// ---------------------------------------------------------------------------
// Tipos de resposta
// ---------------------------------------------------------------------------

export type Startup = {
  id: string
  name: string
  email: string
  stage: 'traction' | 'scaling'
  cnpj: string
  description: string
  city: string
  state: string
  website: string
  is_active: boolean
  created_at: string
  /**
   * Data da última atualização do perfil. O backend AINDA NÃO devolve este
   * campo é opcional para que o dashboard já funcione quando ele existir.
   */
  updated_at?: string
}

export type Company = {
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

/** O que `/auth/login` e `/auth/restore` devolvem, conforme o tipo da sessão. */
export type ContaLogada = Startup | Company

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type TipoSessao = 'startup' | 'company'

/**
 * POST /auth/login
 *
 * Autentica um usuário. O backend deve definir um cookie de sessão
 * (Set-Cookie) na resposta — o browser cuida do resto.
 *
 * Body:
 * ```json
 * { "session": "startup", "email": "user@email.com", "password": "senha123" }
 * ```
 *
 * `session` é obrigatório no backend: "startup" | "company".
 *
 * Respostas:
 * - 200 OK - ContaLogada (Startup ou Company, cookie de sessão definido pelo backend)
 * - 401 Unauthorized - "Wrong email or password"
 */
export async function login(
  email: string,
  password: string,
  session: TipoSessao = 'startup',
): Promise<ContaLogada> {
  const { data } = await api.post<ContaLogada>('/auth/login', { session, email, password })
  return data
}

/**
 * POST /auth/logout
 *
 * Encerra a sessão. O backend deve invalidar o cookie.
 */
export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

/**
 * GET /auth/refresh
 *
 * Renova a duração da sessão por mais 1 hora no backend Gleam.
 * Retorna true se a sessão foi renovada com sucesso (status 204), ou false caso contrário.
 */
export async function renovarSessao(): Promise<boolean> {
  try {
    await api.get('/auth/refresh')
    return true
  } catch {
    return false
  }
}

/**
 * GET /auth/restore
 *
 * Restaura a sessão ao abrir/recarregar o site. O cookie de sessão é
 * enviado automaticamente pelo browser.
 *
 * Respostas:
 * - 200 OK → ContaLogada
 * - 401 Unauthorized → sessão expirada/inexistente (retorna null)
 * - Erro de rede ou status 500 → lança erro para exibir falha temporária sem deslogar
 */
export async function restaurarSessao(): Promise<ContaLogada | null> {
  try {
    const { data } = await api.get<ContaLogada>('/auth/restore')
    return data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Apenas 401 significa que o usuário não está logado
      if (error.response?.status === 401) {
        return null
      }
    }
    // Erros de rede, timeout ou 500 do backend são relançados para indicar falha temporária
    throw error
  }
}

/**
 * Descobre o tipo da conta pelo payload devolvido pelo backend:
 * empresas têm `size`, startups têm `stage`.
 */
export function tipoDaConta(dados: object | null): TipoSessao | null {
  if (!dados) return null
  if ('size' in dados) return 'company'
  if ('stage' in dados) return 'startup'
  return null
}

// ---------------------------------------------------------------------------
// Cadastro de Startup
// ---------------------------------------------------------------------------

export type BodyRegistroStartup = {
  name: string
  email: string
  password: string
  /** Apenas dígitos, exatamente 14 caracteres */
  cnpj: string
  /** Estágio aceito pelo backend: "traction" | "scaling" */
  stage: 'traction' | 'scaling'
  /** Opcional */
  description: string
  city: string
  state: string
  /** URL do site (opcional) */
  website: string
}

/**
 * POST /startup
 *
 * Registra uma nova startup.
 */
export async function registrarStartup(body: BodyRegistroStartup): Promise<Startup> {
  // Aceita também os valores antigos do formulário e converte para os do backend.
  const estagios: Record<string, BodyRegistroStartup['stage']> = {
    tracao: 'traction',
    escala: 'scaling',
    traction: 'traction',
    scaling: 'scaling',
  }
  const stage = estagios[body.stage]
  if (!stage) {
    throw new Error(`Estágio inválido: ${body.stage}`)
  }

  const requestBody: BodyRegistroStartup = {
    ...body,
    cnpj: body.cnpj.replace(/\D/g, ''), // garante que chega sem máscara (só dígitos)
    stage,
    // O backend aceita string vazia, mas nunca null/ausente.
    description: body.description ?? '',
    website: body.website ?? '',
  }

  const returned = await api.post<Startup>('/startup', requestBody)
  return returned.data
}

// ---------------------------------------------------------------------------
// Cadastro de Empresa
// ---------------------------------------------------------------------------

export type TamanhoEmpresa = 'micro' | 'small' | 'medium' | 'big'

export type BodyRegistroEmpresa = {
  name: string
  size: TamanhoEmpresa
  email: string
  password: string
  /** Apenas dígitos, exatamente 14 caracteres */
  cnpj: string
  city: string
  state: string
  /** URL do site (opcional, mas nunca null/ausente) */
  website: string
}

/**
 * POST /company
 *
 * Registra uma nova empresa.
 */
export async function registrarEmpresa(body: BodyRegistroEmpresa): Promise<unknown> {
  const requestBody: BodyRegistroEmpresa = {
    ...body,
    cnpj: body.cnpj.replace(/\D/g, ''),
    website: body.website ?? '',
  }
  const returned = await api.post('/company', requestBody)
  return returned.data
}

// ---------------------------------------------------------------------------
// Atualização de Perfil (PATCH)
// ---------------------------------------------------------------------------

export type BodyAtualizarStartup = {
  name?: string
  description?: string
  city?: string
  state?: string
  website?: string
  stage?: 'traction' | 'scaling'
  email?: string
  cnpj?: string
}

/**
 * PATCH /startup/:id
 *
 * Atualiza os dados de cadastro da startup.
 */
export async function atualizarStartup(
  id: string,
  body: BodyAtualizarStartup,
): Promise<Startup> {
  const requestBody: BodyAtualizarStartup = { ...body }
  if (body.cnpj) {
    requestBody.cnpj = body.cnpj.replace(/\D/g, '')
  }
  const { data } = await api.patch<Startup>(`/startup/${id}`, requestBody)
  return data
}

export type BodyAtualizarEmpresa = {
  name?: string
  city?: string
  state?: string
  website?: string
  size?: TamanhoEmpresa
  email?: string
}

/**
 * PATCH /company/:id
 *
 * Atualiza os dados de cadastro da empresa.
 */
export async function atualizarEmpresa(
  id: string,
  body: BodyAtualizarEmpresa,
): Promise<Company> {
  const { data } = await api.patch<Company>(`/company/${id}`, body)
  return data
}

// ---------------------------------------------------------------------------
// Conexões (Empresa <-> Startup)
// ---------------------------------------------------------------------------

export type StatusConexaoBackend = 'pending' | 'accepted' | 'declined'

export type ConexaoBackend = {
  company: string
  startup: string
  status: StatusConexaoBackend
  created_at: string
  updated_at: string
}

export const LIMITE_PADRAO_CONEXOES = 100

/**
 * POST /api/company/:companyId/connection
 *
 * Solicita uma nova conexão com uma startup.
 */
export async function solicitarConexaoEmpresa(
  companyId: string,
  startupId: string,
): Promise<ConexaoBackend> {
  const { data } = await api.post<ConexaoBackend>(`/company/${companyId}/connection`, {
    startup: startupId,
  })
  return data
}

/**
 * GET /api/company/:companyId/connection?limit=&offset=
 *
 * Lista as conexões iniciadas pela empresa.
 */
export async function listarConexoesEmpresa(
  companyId: string,
  limit: number = LIMITE_PADRAO_CONEXOES,
  offset: number = 0,
): Promise<ConexaoBackend[]> {
  const { data } = await api.get<ConexaoBackend[]>(`/company/${companyId}/connection`, {
    params: { limit, offset },
  })
  return data
}

/**
 * DELETE /api/company/:companyId/connection/:startupId
 *
 * Remove/cancela uma conexão existente da empresa.
 */
export async function excluirConexaoEmpresa(
  companyId: string,
  startupId: string,
): Promise<ConexaoBackend> {
  const { data } = await api.delete<ConexaoBackend>(
    `/company/${companyId}/connection/${startupId}`,
  )
  return data
}

/**
 * GET /api/startup/:startupId/connection?limit=&offset=
 *
 * Lista as conexões recebidas pela startup.
 */
export async function listarConexoesStartup(
  startupId: string,
  limit: number = LIMITE_PADRAO_CONEXOES,
  offset: number = 0,
): Promise<ConexaoBackend[]> {
  const { data } = await api.get<ConexaoBackend[]>(`/startup/${startupId}/connection`, {
    params: { limit, offset },
  })
  return data
}

/**
 * PATCH /api/startup/:startupId/connection/:companyId
 *
 * Atualiza o status da conexão para 'accepted' ou 'declined'.
 */
export async function responderConexaoStartup(
  startupId: string,
  companyId: string,
  status: 'accepted' | 'declined',
): Promise<ConexaoBackend> {
  const { data } = await api.patch<ConexaoBackend>(
    `/startup/${startupId}/connection/${companyId}`,
    { status },
  )
  return data
}

/**
 * DELETE /api/startup/:startupId/connection/:companyId
 *
 * Remove uma conexão da perspectiva da startup.
 */
export async function excluirConexaoStartup(
  startupId: string,
  companyId: string,
): Promise<ConexaoBackend> {
  const { data } = await api.delete<ConexaoBackend>(
    `/startup/${startupId}/connection/${companyId}`,
  )
  return data
}

// ---------------------------------------------------------------------------
// Associação de Tags a Startup
// ---------------------------------------------------------------------------

export async function associarSegmentoStartup(
  startupId: string,
  segmentId: string,
): Promise<unknown> {
  const { data } = await api.post(`/startup/${startupId}/segment`, { segment: segmentId })
  return data
}

export async function desassociarSegmentoStartup(
  startupId: string,
  segmentId: string,
): Promise<unknown> {
  const { data } = await api.delete(`/startup/${startupId}/segment/${segmentId}`)
  return data
}

export async function associarServicoStartup(
  startupId: string,
  serviceId: string,
): Promise<unknown> {
  const { data } = await api.post(`/startup/${startupId}/service`, { service: serviceId })
  return data
}

export async function desassociarServicoStartup(
  startupId: string,
  serviceId: string,
): Promise<unknown> {
  const { data } = await api.delete(`/startup/${startupId}/service/${serviceId}`)
  return data
}

export async function associarTecnologiaStartup(
  startupId: string,
  technologyId: string,
): Promise<unknown> {
  const { data } = await api.post(`/startup/${startupId}/technology`, {
    technology: technologyId,
  })
  return data
}

export async function desassociarTecnologiaStartup(
  startupId: string,
  technologyId: string,
): Promise<unknown> {
  const { data } = await api.delete(`/startup/${startupId}/technology/${technologyId}`)
  return data
}

export async function associarExpertiseStartup(
  startupId: string,
  expertiseId: string,
): Promise<unknown> {
  const { data } = await api.post(`/startup/${startupId}/expertise`, {
    expertise: expertiseId,
  })
  return data
}

export async function desassociarExpertiseStartup(
  startupId: string,
  expertiseId: string,
): Promise<unknown> {
  const { data } = await api.delete(`/startup/${startupId}/expertise/${expertiseId}`)
  return data
}

