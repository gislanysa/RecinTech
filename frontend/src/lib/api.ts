import axios from 'axios'

/**
 * Cliente HTTP da API em Gleam.
 *
 * No dev o Vite faz proxy de `/api` para `http://localhost:8080` (ver
 * `vite.config.ts`), então não há CORS. Em produção defina `VITE_API_URL`.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})
