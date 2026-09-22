import axios from 'axios'

/**
 * Cliente HTTP da API em Gleam.
 *
 * No dev o Vite faz proxy de `/api` para `http://localhost:8000` (ver
 * `vite.config.ts`), então não há CORS. Em produção defina `VITE_API_URL`.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
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

export type RespostaAuth = {
  token: string
  usuario: Usuario
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * POST /auth/login
 *
 * Autentica um usuário e retorna o token de sessão.
 *
 * Body:
 * ```json
 * { "email": "user@email.com", "password": "senha123" }
 * ```
 *
 * Respostas:
 * - 200 OK → { token, usuario }
 * - 401 Unauthorized → "Wrong email or password"
 */
export async function login(email: string, password: string): Promise<RespostaAuth> {
  const { data } = await api.post<RespostaAuth>('/auth/login', { email, password })
  return data
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
 * - 201 Created → Startup
 * - 409 Conflict → "CNPJ ... is already in use"
 * - 400 Bad Request → "Invalid CNPJ format: ..."
 */
export async function registrarStartup(body: BodyRegistroStartup): Promise<Startup> {
  const { data } = await api.post<Startup>('/startup', {
    ...body,
    cnpj: body.cnpj.replace(/\D/g, ''), // garante que chega sem máscara (só dígitos)
  })
  return data
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Salva o token JWT no localStorage para reuso nas próximas requisições. */
export function salvarToken(token: string) {
  localStorage.setItem('token', token)
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

/** Remove o token (logout). */
export function removerToken() {
  localStorage.removeItem('token')
  delete api.defaults.headers.common['Authorization']
}

/** Restaura o token salvo ao inicializar o app (ex.: ao recarregar a página). */
export function restaurarToken() {
  const token = localStorage.getItem('token')
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
