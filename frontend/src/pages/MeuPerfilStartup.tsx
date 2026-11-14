import Botao from '@/components/Botao.tsx'
import ModalEditarTagsStartup from '@/components/dashboard-startup/ModalEditarTagsStartup.tsx'
import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import { Campo as CampoForm, CampoSelect } from '@/components/forms/Campo.tsx'
import { CheckIcon, CloseIcon } from '@/components/icons.tsx'
import { atualizarStartup, type Startup } from '@/lib/api.ts'
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
 * "Meu perfil" — visualização e edição de perfil da startup conectado à API.
 */
export default function MeuPerfilStartup() {
  const { conta } = useOutletContext<ContextoSessao>()
  const startupInicial = conta as Startup

  const [dadosStartup, setDadosStartup] = useState<Startup>(startupInicial)
  const [tags, setTags] = useState<Tags | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [modalTagsAberto, setModalTagsAberto] = useState(false)
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  // Estados do formulário de edição
  const [nome, setNome] = useState(dadosStartup.name)
  const [estagio, setEstagio] = useState<'traction' | 'scaling'>(dadosStartup.stage)
  const [cidade, setCidade] = useState(dadosStartup.city ?? '')
  const [estadoUf, setEstadoUf] = useState(dadosStartup.state ?? '')
  const [website, setWebsite] = useState(dadosStartup.website ?? '')
  const [descricao, setDescricao] = useState(dadosStartup.description ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState('')

  useEffect(() => {
    void carregarTagsDaStartup(dadosStartup.id).then(setTags)
  }, [dadosStartup.id])

  function abrirEdicao() {
    setNome(dadosStartup.name)
    setEstagio(dadosStartup.stage)
    setCidade(dadosStartup.city ?? '')
    setEstadoUf(dadosStartup.state ?? '')
    setWebsite(dadosStartup.website ?? '')
    setDescricao(dadosStartup.description ?? '')
    setErroSalvar('')
    setModalAberto(true)
  }

  async function handleSalvarPerfil(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setErroSalvar('O nome da startup é obrigatório.')
      return
    }

    setSalvando(true)
    setErroSalvar('')

    try {
      const atualizada = await atualizarStartup(dadosStartup.id, {
        name: nome.trim(),
        stage: estagio,
        city: cidade.trim(),
        state: estadoUf.trim(),
        website: website.trim(),
        description: descricao.trim(),
      })
      setDadosStartup(atualizada)
      setModalAberto(false)
      setMensagemSucesso('Perfil atualizado com sucesso!')
      setTimeout(() => setMensagemSucesso(''), 4000)
    } catch {
      setErroSalvar('Não foi possível salvar as alterações. Verifique seus dados e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

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
            to={`/startups/${dadosStartup.id}`}
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

      {mensagemSucesso && (
        <div className="flex items-center gap-2 rounded-xl border border-accent-300 bg-accent-100 p-4 text-sm font-medium text-ink-900">
          <CheckIcon className="size-5 text-accent-700" />
          {mensagemSucesso}
        </div>
      )}

      <section className="rounded-card border border-brand-100 bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-ink-900">Dados do cadastro</h2>
          <Botao onClick={abrirEdicao}>
            Editar perfil
          </Botao>
        </div>

        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          <Campo rotulo="Nome" valor={dadosStartup.name} />
          <Campo rotulo="Estágio" valor={ESTAGIOS[dadosStartup.stage] ?? dadosStartup.stage} />
          <Campo rotulo="CNPJ" valor={dadosStartup.cnpj && formatarCnpj(dadosStartup.cnpj)} />
          <Campo
            rotulo="Localização"
            valor={[dadosStartup.city, dadosStartup.state].filter(Boolean).join(', ')}
          />
          <Campo rotulo="Site" valor={dadosStartup.website} />
          <Campo rotulo="E-mail de acesso" valor={dadosStartup.email} />
          <div className="sm:col-span-2">
            <Campo rotulo="Descrição" valor={dadosStartup.description} />
          </div>
        </dl>
      </section>

      <section className="rounded-card border border-brand-100 bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Áreas, serviços e tecnologias</h2>
            <p className="mt-1 text-sm text-ink-500">
              São estas marcações que fazem sua startup aparecer nas buscas das empresas.
            </p>
          </div>
          <Botao onClick={() => setModalTagsAberto(true)}>
            Editar
          </Botao>
        </div>

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

      {/* Modal de Edição de Perfil */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-editar-perfil"
        >
          <div className="w-full max-w-lg rounded-2xl border border-brand-100 bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-100 pb-4">
              <h2 id="titulo-editar-perfil" className="font-display text-lg font-bold text-ink-900">
                Editar perfil da startup
              </h2>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="rounded-lg p-1 text-ink-500 hover:bg-brand-50 hover:text-ink-700"
                aria-label="Fechar"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarPerfil} className="mt-5 space-y-4">
              {erroSalvar && (
                <p className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
                  {erroSalvar}
                </p>
              )}

              <CampoForm
                id="edit-startup-nome"
                label="Nome da startup"
                required
                value={nome}
                onChange={setNome}
              />

              <CampoSelect
                id="edit-startup-estagio"
                label="Estágio atual"
                required
                value={estagio}
                onChange={(v) => setEstagio(v as 'traction' | 'scaling')}
                opcoes={['Tração (validação e primeiros clientes)', 'Escala (crescimento acelerado)']}
                valores={['traction', 'scaling']}
              />

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <CampoForm
                    id="edit-startup-cidade"
                    label="Cidade"
                    value={cidade}
                    onChange={setCidade}
                  />
                </div>
                <div>
                  <CampoForm
                    id="edit-startup-estado"
                    label="UF"
                    value={estadoUf}
                    onChange={(v) => setEstadoUf(v.toUpperCase().slice(0, 2))}
                  />
                </div>
              </div>

              <CampoForm
                id="edit-startup-website"
                label="Site / Website"
                type="url"
                placeholder="https://..."
                value={website}
                onChange={setWebsite}
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-startup-descricao" className="text-sm font-medium text-ink-700">
                  Descrição sobre a solução
                </label>
                <textarea
                  id="edit-startup-descricao"
                  rows={3}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Resuma o valor e as soluções oferecidas..."
                  className="w-full rounded-xl border border-brand-200 bg-surface px-3.5 py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-500/60 focus:border-transparent focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
                  className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-brand-50"
                >
                  Cancelar
                </button>
                <Botao type="submit" disabled={salvando}>
                  {salvando ? 'Salvando…' : 'Salvar alterações'}
                </Botao>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Edição de Áreas, Serviços e Tecnologias */}
      <ModalEditarTagsStartup
        aberto={modalTagsAberto}
        startupId={dadosStartup.id}
        aoFechar={() => setModalTagsAberto(false)}
        aoSalvarSucesso={(tagsAtualizadas) => {
          if (tagsAtualizadas) {
            setTags(tagsAtualizadas)
          } else {
            void carregarTagsDaStartup(dadosStartup.id).then(setTags)
          }
          setMensagemSucesso('Áreas, serviços e tecnologias atualizados com sucesso!')
          setTimeout(() => setMensagemSucesso(''), 4000)
        }}
      />
    </div>
  )
}
