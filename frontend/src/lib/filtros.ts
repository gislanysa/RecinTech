import type { StartupCatalogo } from '@/lib/startups.ts'

export type Filtros = {
  areas: string[]
  services: string[]
  technologies: string[]
  segments: string[]
  states: string[]
  cities: string[]
  remote: boolean
  onsite: boolean
}

export const FILTROS_VAZIOS: Filtros = {
  areas: [],
  services: [],
  technologies: [],
  segments: [],
  states: [],
  cities: [],
  remote: false,
  onsite: false,
}

export function contarAtivos(f: Filtros): number {
  return (
    f.areas.length +
    f.services.length +
    f.technologies.length +
    f.segments.length +
    f.states.length +
    f.cities.length +
    (f.remote ? 1 : 0) +
    (f.onsite ? 1 : 0)
  )
}

export function cidadesDisponiveis(startups: StartupCatalogo[]): string[] {
  return Array.from(new Set(startups.map((s) => s.city))).sort()
}
