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
  stage: string
  cnpj: string
  description: string
  city: string
  state: string
  created_at: string
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * POST /auth/login
 *
 * Autentica um usuário. O backend deve definir um cookie de sessão
 * (Set-Cookie) na resposta — o browser cuida do resto.
 *
 * Body:
 * ```json
 * { "email": "user@email.com", "password": "senha123" }
 * ```
 *
 * Respostas:
 * - 200 OK - Usuario (cookie de sessão definido pelo backend)
 * - 401 Unauthorized - "Wrong email or password"
 */
export async function login(email: string, password: string): Promise<Usuario> {
  const { data } = await api.post<Usuario>('/auth/login', { email, password })
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
export async function restaurarSessao(): Promise<Usuario | null> {
  try {
    const { data } = await api.get<Usuario>('/auth/restore')
    return data
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Cadastro de Usuário
// ---------------------------------------------------------------------------

export type BodyRegistroUsuario = {
  full_name: string
  email: string
  password: string
}

/**
 * POST /user
 *
 * Registra um novo usuário.
 *
 * Body:
 * ```json
 * { "full_name": "Maria Silva", "email": "maria@email.com", "password": "senha123" }
 * ```
 *
 * Respostas:
 * - 201 Created → Usuario
 * - 409 Conflict → "Email ... is already in use"
 * - 400 Bad Request → "Invalid email address: ..."
 */
export async function registrarUsuario(body: BodyRegistroUsuario): Promise<Usuario> {
  const { data } = await api.post<Usuario>('/user', body)
  return data
}

// ---------------------------------------------------------------------------
// Cadastro de Startup
// ---------------------------------------------------------------------------

export type BodyRegistroStartup = {
  name: string
  /** Apenas dígitos, exatamente 14 caracteres */
  cnpj: string
  stage: string
  description: string
  city: string
  state: string
  /** URL do site (opcional) */
  site?: string
}

/**
 * POST /startup
 *
 * Registra uma nova startup. Deve ser chamado APÓS criar o usuário
 * responsável com {@link registrarUsuario}.
 *
 * Body:
 * ```json
 * {
 *   "name": "Nexus AI",
 *   "cnpj": "12345678000195",
 *   "stage": "tracao",
 *   "description": "",
 *   "city": "Recife",
 *   "state": "PE"
 * }
 * ```
 *
 * Respostas:
 * - 201 Created - Startup
 * - 409 Conflict - "CNPJ ... is already in use"
 * - 400 Bad Request - "Invalid CNPJ format: ..."
 */
export async function registrarStartup(body: BodyRegistroStartup): Promise<Startup> {
  const { data } = await api.post<Startup>('/startup', {
    ...body,
    cnpj: body.cnpj.replace(/\D/g, ''), // garante que chega sem máscara (só dígitos)
  })
  return data
}
