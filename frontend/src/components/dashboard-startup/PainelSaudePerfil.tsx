import Botao from '@/components/Botao.tsx'
import { AlertIcon, CheckIcon } from '@/components/icons.tsx'
import type { Startup } from '@/lib/api.ts'
import {
  DIAS_PARA_PERFIL_DESATUALIZADO,
  calcularSaudeDoPerfil,
  diasSemAtualizar,
  type Tags,
} from '@/lib/perfil.ts'

const ROTA_EDITAR_PERFIL = '/dashboard/startup/perfil'

function mensagem(porcentagem: number, faltando: string[]): string {
  if (porcentagem === 100) return 'Seu perfil está completo. Continue assim para aparecer melhor nas recomendações.'
  const lista = faltando.slice(0, 3).join(', ')
  const resto = faltando.length > 3 ? ` e mais ${faltando.length - 3}` : ''
  return `Complete as informações que faltam para ser encontrada por mais empresas: ${lista}${resto}.`
}

/**
 * Painel "Saúde do perfil": porcentagem calculada pelos campos preenchidos e
 * alerta de perfil desatualizado (> 90 dias sem atualização).
 *
 * `tags === null` significa "ainda carregando" — as tags (serviços, tecnologias,
 * segmentos e área) vêm de rotas separadas e chegam depois da startup.
 */
export default function PainelSaudePerfil({ startup, tags }: { startup: Startup; tags: Tags | null }) {
  const saude = calcularSaudeDoPerfil(startup, tags)
  const dias = diasSemAtualizar(startup)
  const desatualizado = dias !== null && dias > DIAS_PARA_PERFIL_DESATUALIZADO

  return (
    <section
      aria-labelledby="titulo-saude-perfil"
      className="rounded-card border border-brand-100 bg-surface p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="titulo-saude-perfil" className="text-lg font-semibold">
            Saúde do perfil
          </h2>
          <p className="mt-1 max-w-xl text-sm text-ink-500">
            {tags === null ? 'Calculando a completude do seu perfil…' : mensagem(saude.porcentagem, saude.faltando.map((i) => i.rotulo))}
          </p>
        </div>
        <p className="font-display text-4xl font-bold leading-none text-brand-600" aria-live="polite">
          {saude.porcentagem}
          <span className="text-2xl">%</span>
        </p>
      </div>

      <div
        role="progressbar"
        aria-label="Completude do perfil"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={saude.porcentagem}
        className="mt-5 h-3 overflow-hidden rounded-full bg-brand-100"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-[width] duration-700 ease-out"
          style={{ width: `${saude.porcentagem}%` }}
        />
      </div>

      {tags !== null && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Campos do perfil">
          {saude.itens.map((item) => (
            <li
              key={item.chave}
              className={[
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                item.preenchido ? 'bg-brand-50 text-brand-700' : 'bg-accent-100 text-accent-700',
              ].join(' ')}
            >
              {item.preenchido && <CheckIcon className="size-3.5" />}
              {item.rotulo}
              {!item.preenchido && <span className="sr-only"> (pendente)</span>}
            </li>
          ))}
        </ul>
      )}

      {desatualizado && (
        <div
          role="alert"
          className="mt-5 flex flex-wrap items-start gap-3 rounded-xl border border-accent-300 bg-accent-100 p-4"
        >
          <AlertIcon className="mt-0.5 size-5 shrink-0 text-accent-700" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-900">Seu perfil está desatualizado</p>
            <p className="mt-0.5 text-sm text-ink-700">
              Faz {dias} dias que você não atualiza o perfil. Mantê-lo em dia melhora a relevância da sua startup nas
              recomendações de matchmaking — vale revisar suas informações.
            </p>
          </div>
          <Botao to={ROTA_EDITAR_PERFIL} id="btn-revisar-perfil">
            Revisar perfil
          </Botao>
        </div>
      )}

      <div className="mt-5">
        <Botao to={ROTA_EDITAR_PERFIL} id="btn-editar-perfil">
          Editar perfil
        </Botao>
      </div>
    </section>
  )
}
