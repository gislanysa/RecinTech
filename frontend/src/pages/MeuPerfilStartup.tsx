import Botao from '@/components/Botao.tsx'
import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import { AlertIcon } from '@/components/icons.tsx'
import type { Startup } from '@/lib/api.ts'
import type { Tags } from '@/lib/perfil.ts'
import { carregarTagsDaStartup } from '@/lib/startups.ts'
import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'

const ESTAGIOS: Record<string, string> = {
  traction: 'Tração',
  scaling: 'Escala',
}

/** 14 dígitos viram XX.XXX.XXX/XXXX-XX; qualquer outro formato passa direto. */
function formatarCnpj(valor: string): string {
  const numeros = valor.replace(/\D/g, '')
  if (numeros.length !== 14) return valor
  return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

function Campo({ rotulo, valor }: { rotulo: string; valor?: string }) {
  const vazio = !valor || !valor.trim()
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">{rotulo}</dt>
      <dd className={vazio ? 'mt-1 text-sm italic text-ink-500' : 'mt-1 text-sm text-ink-900'}>
        {vazio ? 'Não informado' : valor}
      </dd>
    </div>
  )
}

function GrupoDeTags({ rotulo, itens }: { rotulo: string; itens: string[] }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">{rotulo}</dt>
      <dd className="mt-2">
        {itens.length === 0 ? (
          <span className="text-sm italic text-ink-500">Nenhum cadastrado</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {itens.map((item) => (
              <span
                key={item}
                className="rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700 ring-1 ring-brand-100"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </dd>
    </div>
  )
}

/**
 * "Meu perfil" — os dados da própria startup, em modo leitura.
 *
 * A edição ainda NÃO existe: o backend não expõe nenhuma rota de alteração
 * (não há `PUT`/`PATCH` em `web.gleam`, nem `update.sql` em `startup/sql/`),
 * e também não há como desatribuir uma tag já associada. Enquanto isso não
 * chega, a tela mostra os dados reais e diz por que o botão está desligado,
 * em vez de abrir um formulário que não teria para onde enviar.
 */
export default function MeuPerfilStartup() {
  const { conta } = useOutletContext<ContextoSessao>()
  const startup = conta as Startup
  const [tags, setTags] = useState<Tags | null>(null)

  useEffect(() => {
    void carregarTagsDaStartup(startup.id).then(setTags)
  }, [startup.id])

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Meu perfil
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            É isto que as empresas veem quando encontram sua startup.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            to={`/startups/${startup.id}`}
            className="text-sm font-medium text-brand-600 underline-offset-4 hover:underline"
          >
            Ver meu perfil público
          </Link>
          <Link
            to="/startups"
            className="text-sm font-medium text-brand-600 underline-offset-4 hover:underline"
          >
            Ver outras startups
          </Link>
        </div>
      </header>

      <div className="flex items-start gap-3 rounded-card border border-accent-300 bg-accent-100 p-4">
        <AlertIcon className="mt-0.5 size-5 shrink-0 text-accent-700" />
        <div>
          <p className="text-sm font-medium text-ink-900">A edição ainda não está disponível</p>
          <p className="mt-1 text-sm text-ink-700">
            O servidor ainda não tem rota para alterar os dados de uma startup já cadastrada. Assim
            que ela existir, esta mesma tela passa a permitir a edição.
          </p>
        </div>
      </div>

      <section className="rounded-card border border-brand-100 bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Dados do cadastro</h2>
          <Botao disabled>
            Editar perfil
          </Botao>
        </div>

        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          <Campo rotulo="Nome" valor={startup.name} />
          <Campo rotulo="Estágio" valor={ESTAGIOS[startup.stage] ?? startup.stage} />
          <Campo rotulo="CNPJ" valor={startup.cnpj && formatarCnpj(startup.cnpj)} />
          <Campo
            rotulo="Localização"
            valor={[startup.city, startup.state].filter(Boolean).join(', ')}
          />
          <Campo rotulo="Site" valor={startup.website} />
          <Campo rotulo="E-mail de acesso" valor={startup.email} />
          <div className="sm:col-span-2">
            <Campo rotulo="Descrição" valor={startup.description} />
          </div>
        </dl>
      </section>

      <section className="rounded-card border border-brand-100 bg-surface p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold">Áreas, serviços e tecnologias</h2>
        <p className="mt-1 text-sm text-ink-500">
          São estas marcações que fazem sua startup aparecer nas buscas das empresas.
        </p>

        {tags === null ? (
          <p className="mt-6 text-sm text-ink-500">Carregando…</p>
        ) : (
          <dl className="mt-6 grid gap-6 sm:grid-cols-2">
            <GrupoDeTags rotulo="Área de atuação" itens={tags.area ? [tags.area] : []} />
            <GrupoDeTags rotulo="Serviços" itens={tags.services} />
            <GrupoDeTags rotulo="Tecnologias" itens={tags.technologies} />
            <GrupoDeTags rotulo="Segmentos" itens={tags.segments} />
          </dl>
        )}
      </section>
    </div>
  )
}
