import { ChevronRightIcon } from '@/components/icons.tsx'
import { AREAS, SEGMENTS, SERVICES, STATES, TECHNOLOGIES, type StartupCatalogo } from '@/lib/startups.ts'
import { useState } from 'react'

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

type Chave = 'areas' | 'services' | 'technologies' | 'segments' | 'states' | 'cities'

type PainelDeFiltrosProps = {
  filtros: Filtros
  setFiltros: (f: Filtros) => void
  cidades: string[]
  onLimpar: () => void
}

/**
 * Sanfona + checkboxes simples, sem lib de UI (mesma regra do resto do
 * projeto — ver `icons.tsx`). "Área de atuação" e "Serviços" abrem por
 * padrão, o resto começa fechado, igual ao protótipo.
 */
export default function PainelDeFiltros({ filtros, setFiltros, cidades, onLimpar }: PainelDeFiltrosProps) {
  function alternar(chave: Chave, opcao: string) {
    const atual = filtros[chave]
    const proximo = atual.includes(opcao) ? atual.filter((o) => o !== opcao) : [...atual, opcao]
    setFiltros({ ...filtros, [chave]: proximo })
  }

  return (
    <div className="space-y-1">
      <Grupo
        titulo="Área de atuação"
        opcoes={AREAS}
        valor={filtros.areas}
        aoAlternar={(o) => alternar('areas', o)}
        abertoPorPadrao
      />
      <Grupo
        titulo="Serviços"
        opcoes={SERVICES}
        valor={filtros.services}
        aoAlternar={(o) => alternar('services', o)}
        abertoPorPadrao
      />
      <Grupo titulo="Tecnologias" opcoes={TECHNOLOGIES} valor={filtros.technologies} aoAlternar={(o) => alternar('technologies', o)} />
      <Grupo titulo="Segmento" opcoes={SEGMENTS} valor={filtros.segments} aoAlternar={(o) => alternar('segments', o)} />

      <GrupoAberto titulo="Localização">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Estado</p>
          <div className="flex flex-wrap gap-1.5">
            {STATES.map((uf) => (
              <ChipFiltro key={uf} ativo={filtros.states.includes(uf)} onClick={() => alternar('states', uf)}>
                {uf}
              </ChipFiltro>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Cidade</p>
          <div className="flex flex-wrap gap-1.5">
            {cidades.map((cidade) => (
              <ChipFiltro key={cidade} ativo={filtros.cities.includes(cidade)} onClick={() => alternar('cities', cidade)}>
                {cidade}
              </ChipFiltro>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2.5 border-t border-brand-100 pt-4">
          <ToggleLinha
            rotulo="Atendimento remoto"
            marcado={filtros.remote}
            onChange={(v) => setFiltros({ ...filtros, remote: v })}
          />
          <ToggleLinha
            rotulo="Atendimento presencial"
            marcado={filtros.onsite}
            onChange={(v) => setFiltros({ ...filtros, onsite: v })}
          />
        </div>
      </GrupoAberto>

      <div className="pt-4">
        <button
          type="button"
          onClick={onLimpar}
          className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-ink-500 transition-colors hover:bg-brand-50 hover:text-ink-700"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  )
}

/* ---------- sub-componentes ---------- */

function Grupo({
  titulo,
  opcoes,
  valor,
  aoAlternar,
  abertoPorPadrao = false,
}: {
  titulo: string
  opcoes: readonly string[]
  valor: string[]
  aoAlternar: (opcao: string) => void
  abertoPorPadrao?: boolean
}) {
  const [aberto, setAberto] = useState(abertoPorPadrao)

  return (
    <div className="border-b border-brand-100 py-3">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center gap-2 text-left text-sm font-semibold text-ink-900"
      >
        <span className="flex-1">{titulo}</span>
        {valor.length > 0 && (
          <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700">
            {valor.length}
          </span>
        )}
        <ChevronRightIcon className={['size-4 text-ink-500 transition-transform', aberto ? '-rotate-90' : 'rotate-90'].join(' ')} />
      </button>

      {aberto && (
        <div className="mt-3 space-y-2.5">
          {opcoes.map((opcao) => (
            <label key={opcao} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={valor.includes(opcao)}
                onChange={() => aoAlternar(opcao)}
                className="size-4 shrink-0 rounded border-brand-300 accent-brand-600"
              />
              <span className="min-w-0 truncate text-ink-500">{opcao}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

/** Igual ao `Grupo`, mas com conteúdo livre em vez de checkboxes (usado só pela seção "Localização"). */
function GrupoAberto({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="border-b border-brand-100 py-3">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center gap-2 text-left text-sm font-semibold text-ink-900"
      >
        <span className="flex-1">{titulo}</span>
        <ChevronRightIcon className={['size-4 text-ink-500 transition-transform', aberto ? '-rotate-90' : 'rotate-90'].join(' ')} />
      </button>

      {aberto && <div className="mt-3">{children}</div>}
    </div>
  )
}

function ChipFiltro({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
        ativo ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-brand-200 text-ink-500 hover:bg-brand-50',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function ToggleLinha({ rotulo, marcado, onChange }: { rotulo: string; marcado: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm text-ink-500">{rotulo}</span>
      <span className="relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors" data-marcado={marcado}>
        <input
          type="checkbox"
          checked={marcado}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-brand-200 transition-colors peer-checked:bg-brand-600" />
        <span className="relative size-4 translate-x-1 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  )
}