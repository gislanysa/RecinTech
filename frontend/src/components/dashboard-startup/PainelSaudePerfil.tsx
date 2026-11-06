import Botao from '@/components/Botao.tsx'
import { AlertIcon, CheckIcon } from '@/components/icons.tsx'
import type { Startup } from '@/lib/api.ts'
import {
  DIAS_PARA_PERFIL_DESATUALIZADO,
  calcularSaudeDoPerfil,
  diasSemAtualizar,
  type ItemSaude,
  type Tags,
} from '@/lib/perfil.ts'
import { Link } from 'react-router-dom'

const ROTA_EDITAR_PERFIL = '/dashboard/startup/perfil'

/**
 * Painel "Saúde do perfil".
 *
 * Mostra quanto do perfil está preenchido e, no lugar de só apontar o que
 * falta, transforma cada pendência em um próximo passo com verbo e botão.
 *
 * O número fica à esquerda e a lista de passos à direita, em duas colunas,
 * para o painel não empurrar o resto do dashboard para fora da tela.
 *
 * `tags === null` significa "ainda carregando". Como quatro dos dez itens são
 * tags, calcular a porcentagem antes delas chegarem mostraria um número baixo
 * que logo salta, por isso o número e a barra só aparecem depois.
 */
export default function PainelSaudePerfil({ startup, tags }: { startup: Startup; tags: Tags | null }) {
  const carregando = tags === null
  const saude = calcularSaudeDoPerfil(startup, tags)
  const dias = diasSemAtualizar(startup)
  const desatualizado = dias !== null && dias > DIAS_PARA_PERFIL_DESATUALIZADO
  const completo = !carregando && saude.faltando.length === 0

  return (
    <section
      aria-labelledby="titulo-saude-perfil"
      className="rounded-card border border-brand-100 bg-surface p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-6">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            <h2 id="titulo-saude-perfil" className="text-lg font-semibold">
              Saúde do perfil
            </h2>

            {carregando ? (
              <div className="h-9 w-16 animate-pulse rounded-lg bg-brand-100" aria-hidden="true" />
            ) : (
              <p className="font-display text-4xl font-bold leading-none text-brand-600" aria-live="polite">
                {saude.porcentagem}
                <span className="text-2xl">%</span>
              </p>
            )}
          </div>

          {carregando ? (
            <div className="mt-5 h-3 animate-pulse rounded-full bg-brand-100" aria-hidden="true" />
          ) : (
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
          )}

          <p className="mt-3 text-sm text-ink-500">
            {carregando
              ? 'Calculando a completude do seu perfil…'
              : completo
                ? 'Seu perfil está completo. É assim que as empresas conseguem te encontrar.'
                : `Faltam ${saude.faltando.length} ${saude.faltando.length === 1 ? 'item' : 'itens'} para chegar aos 100%.`}
          </p>

          {desatualizado && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-xl border border-accent-300 bg-accent-100 p-3"
            >
              <AlertIcon className="mt-0.5 size-4 shrink-0 text-accent-700" />
              <p className="text-xs text-ink-700">
                <span className="font-semibold text-ink-900">Perfil desatualizado.</span> Faz {dias} dias
                sem atualização, e startups atualizadas aparecem melhor nas recomendações.
              </p>
            </div>
          )}

          {!carregando && saude.itens.some((i) => i.preenchido) && (
            <p className="mt-4 text-xs text-ink-500">
              <CheckIcon className="mr-1 inline size-3.5 align-[-2px] text-brand-600" />
              Já preenchidos: {saude.itens.filter((i) => i.preenchido).map((i) => i.rotulo).join(', ')}.
            </p>
          )}

          <div className="mt-4">
            <Botao to={ROTA_EDITAR_PERFIL} id="btn-editar-perfil">
              Ver meu perfil
            </Botao>
          </div>
        </div>

        {!carregando && !completo && (
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink-900">Próximos passos</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {saude.faltando.map((item) => (
                <ProximoPasso key={item.chave} item={item} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

/**
 * Uma pendência como linha de ação.
 *
 * Itens com `disponivel: false` dependem de uma rota de alteração que o
 * backend ainda não tem, então o botão fica desligado e a linha explica isso
 * em vez de levar a pessoa a uma tela onde ela não consegue fazer nada.
 */
function ProximoPasso({ item }: { item: ItemSaude }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-surface-2 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-900">{item.comoPreencher}</p>
        {!item.disponivel && (
          <p className="text-xs text-ink-500">Disponível quando a edição do cadastro existir.</p>
        )}
      </div>

      {item.disponivel ? (
        <Link
          to={ROTA_EDITAR_PERFIL}
          className="shrink-0 rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-ink-900 ring-1 ring-brand-200 transition-colors hover:bg-brand-600 hover:text-white hover:ring-brand-600"
        >
          {item.acao}
        </Link>
      ) : (
        <span className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium text-ink-500 ring-1 ring-brand-100">
          {item.acao}
        </span>
      )}
    </li>
  )
}
