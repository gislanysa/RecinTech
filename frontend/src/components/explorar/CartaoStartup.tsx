import type { StartupCatalogo } from '@/lib/startups.ts'
import { Link } from 'react-router-dom'

/**
 * Cores do avatar giram entre tons da própria marca (nunca o índigo/violeta
 * padrão do shadcn — ver o comentário sobre isso em `index.css`), escolhidas
 * de forma determinística a partir do slug, então a mesma startup sempre
 * cai na mesma cor.
 */
const CORES_AVATAR = ['bg-brand-600', 'bg-accent-600', 'bg-brand-800', 'bg-ink-700', 'bg-brand-400', 'bg-accent-700']

function corAvatar(slug: string): string {
  const soma = [...slug].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return CORES_AVATAR[soma % CORES_AVATAR.length]
}

export function AvatarStartup({ startup, tamanho = 'md' }: { startup: StartupCatalogo; tamanho?: 'md' | 'lg' }) {
  return (
    <span
      className={[
        'grid shrink-0 place-items-center rounded-xl font-display font-bold text-white',
        corAvatar(startup.slug),
        tamanho === 'lg' ? 'size-16 text-xl' : 'size-12 text-sm',
      ].join(' ')}
    >
      {startup.initials}
    </span>
  )
}

export default function CartaoStartup({
  startup,
  isAutenticado = false,
}: {
  startup: StartupCatalogo
  isAutenticado?: boolean
}) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-card border border-brand-100 bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <AvatarStartup startup={startup} />
        <div className="min-w-0">
          {/* Nome: borrado + não selecionável para visitantes */}
          <h3
            className={[
              'truncate text-base font-semibold text-ink-900 transition-[filter]',
              !isAutenticado ? 'select-none blur-[5px]' : '',
            ].join(' ')}
            aria-hidden={!isAutenticado}
          >
            {startup.name}
          </h3>
          <p className="truncate text-xs text-ink-500">{startup.area}</p>
        </div>
      </div>

      <p className="line-clamp-3 text-sm text-ink-500">{startup.tagline}</p>

      <div className="flex flex-wrap gap-1.5">
        {startup.services.slice(0, 2).map((s) => (
          <span key={s} className="rounded-lg bg-brand-50 px-2 py-1 text-xs text-brand-700">
            {s}
          </span>
        ))}
        {startup.technologies.slice(0, 2).map((t) => (
          <span key={t} className="rounded-lg border border-brand-200 px-2 py-1 text-xs text-ink-500">
            {t}
          </span>
        ))}
      </div>

      {startup.segments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {startup.segments.map((seg) => (
            <span key={seg} className="rounded-md bg-accent-100 px-2 py-0.5 text-[11px] font-medium text-accent-700">
              {seg}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto space-y-3">
        <p className="text-xs text-ink-500">
          {startup.city}, {startup.state}
          {startup.remote ? ' · Atende remoto' : ''}
        </p>

        {isAutenticado ? (
          <Link
            to={`/startups/${startup.slug}`}
            className="block rounded-xl bg-brand-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Ver perfil
          </Link>
        ) : (
          <Link
            to="/criar-conta"
            className="flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 shrink-0" aria-hidden="true">
              <path d="M12 1C8.676 1 6 3.676 6 7v1H4v15h16V8h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
            </svg>
            Cadastre-se para ver
          </Link>
        )}
      </div>
    </article>
  )
}

export function CartaoStartupCarregando() {
  return (
    <div className="h-full animate-pulse rounded-card border border-brand-100 bg-surface p-5">
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-xl bg-brand-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded bg-brand-100" />
          <div className="h-3 w-1/4 rounded bg-brand-100" />
        </div>
      </div>
      <div className="mt-4 h-3 w-full rounded bg-brand-100" />
      <div className="mt-2 h-3 w-4/5 rounded bg-brand-100" />
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-20 rounded-lg bg-brand-100" />
        <div className="h-6 w-16 rounded-lg bg-brand-100" />
      </div>
      <div className="mt-4 h-9 w-full rounded-xl bg-brand-100" />
    </div>
  )
}