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
// Tipos de resposta
// ---------------------------------------------------------------------------

export type Usuario = {
  id: string
  full_name: string
  email: string
  created_at: string
  is_active: boolean
}

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
 * GET /auth/restore
 *
 * Restaura a sessão ao abrir/recarregar o site. O cookie de sessão é
 * enviado automaticamente pelo browser. Se o cookie ainda for válido,
 * o backend retorna os dados do usuário. Senão retorna 401.
 *
 * Respostas:
 * - 200 OK → Usuario
 * - 401 Unauthorized → sessão expirada
 */
export async function restaurarSessao(): Promise<ContaLogada | null> {
  try {
    const { data } = await api.get<ContaLogada>('/auth/restore')
    return data
  } catch {
    return null
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
