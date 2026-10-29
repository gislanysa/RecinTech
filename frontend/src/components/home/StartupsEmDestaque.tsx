import Botao from '@/components/Botao.tsx'
import CartaoStartup, { CartaoStartupCarregando } from '@/components/explorar/CartaoStartup.tsx'
import { listarStartups, type StartupCatalogo } from '@/lib/startups.ts'
import { useEffect, useState } from 'react'

/** Cabe uma linha cheia na grade de três colunas. */
const QUANTIDADE = 3

export default function StartupsEmDestaque() {
  const [startups, setStartups] = useState<StartupCatalogo[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    listarStartups({
      limit: QUANTIDADE,
      // As tags vêm de quatro rotas separadas e chegam depois dos dados
      // básicos: cada startup é trocada no lugar assim que as dela chegam.
      aoAtualizar: (startup) =>
        setStartups((atual) => atual.map((s) => (s.id === startup.id ? startup : s))),
    }).then((dados) => {
      // O `limit` vale para a API; o mock de desenvolvimento devolve a lista
      // inteira, então o corte é feito aqui também.
      setStartups(dados.slice(0, QUANTIDADE))
      setCarregando(false)
    })
  }, [])

  return (
    <section id="destaques" className="scroll-mt-16 bg-surface py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Startups em destaque</h2>
        <p className="mt-4 max-w-2xl text-lg text-ink-500">
          Algumas das startups do Porto Digital que já estão na plataforma.
        </p>

        {carregando ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: QUANTIDADE }).map((_, i) => (
              <CartaoStartupCarregando key={i} />
            ))}
          </div>
        ) : startups.length > 0 ? (
          <>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {startups.map((startup) => (
                <CartaoStartup key={startup.id} startup={startup} />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Botao to="/startups">Ver todas as startups</Botao>
            </div>
          </>
        ) : (
          <p className="mt-12 rounded-card border border-dashed border-brand-200 px-6 py-12 text-center text-sm text-ink-500">
            Nenhuma startup cadastrada ainda. Assim que as primeiras entrarem, elas aparecem aqui.
          </p>
        )}
      </div>
    </section>
  )
}
