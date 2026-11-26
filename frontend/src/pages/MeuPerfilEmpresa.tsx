import Botao from '@/components/Botao.tsx'
import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import { Campo as CampoForm, CampoSelect } from '@/components/forms/Campo.tsx'
import {
  BuildingIcon,
  CheckIcon,
  CloseIcon,
  LinkIcon,
} from '@/components/icons.tsx'
import { useAuth } from '@/contexts/useAuth.ts'
import { atualizarEmpresa, type Company, type TamanhoEmpresa } from '@/lib/api.ts'
import { UFS } from '@/lib/ufs.ts'
import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'

const PORTES: Record<TamanhoEmpresa, string> = {
  micro: 'Microempresa — até 9 colaboradores',
  small: 'Pequena — 10 a 49 colaboradores',
  medium: 'Média — 50 a 249 colaboradores',
  big: 'Grande — 250 ou mais colaboradores',
}

const OPCOES_PORTE: { valor: TamanhoEmpresa; rotulo: string }[] = [
  { valor: 'micro', rotulo: 'Microempresa (até 9 colaboradores)' },
  { valor: 'small', rotulo: 'Pequena empresa (10 a 49 colaboradores)' },
  { valor: 'medium', rotulo: 'Média empresa (50 a 249 colaboradores)' },
  { valor: 'big', rotulo: 'Grande empresa (250 ou mais colaboradores)' },
]

/** 14 dígitos viram XX.XXX.XXX/XXXX-XX; qualquer outro formato passa direto. */
function formatarCnpj(valor?: string): string {
  if (!valor) return ''
  const numeros = valor.replace(/\D/g, '')
  if (numeros.length !== 14) return valor
  return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

function formatarData(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

function formatarUrlExibicao(url?: string): string {
  if (!url) return ''
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

function CampoVisualizacao({
  rotulo,
  valor,
  link = false,
}: Readonly<{
  rotulo: string
  valor?: string
  link?: boolean
}>) {
  const vazio = !valor?.trim()

  let conteudo: React.ReactNode = valor
  if (vazio) {
    conteudo = 'Não informado'
  } else if (link && valor) {
    conteudo = (
      <a
        href={valor.startsWith('http') ? valor : `https://${valor}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-brand-600 underline-offset-4 hover:underline"
      >
        {formatarUrlExibicao(valor)}
        <LinkIcon className="size-3.5 text-brand-400" />
      </a>
    )
  }

  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">{rotulo}</dt>
      <dd className={vazio ? 'mt-1 text-sm italic text-ink-500' : 'mt-1 text-sm text-ink-900'}>
        {conteudo}
      </dd>
    </div>
  )
}

/**
 * "Meu perfil" — visualização e edição de perfil da empresa conectado à API.
 */
export default function MeuPerfilEmpresa() {
  const { conta } = useOutletContext<ContextoSessao>()
  const empresaInicial = conta as Company
  const { definirConta } = useAuth()

  const [dadosEmpresa, setDadosEmpresa] = useState<Company>(empresaInicial)
  const [modalAberto, setModalAberto] = useState(false)
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  // Estados do formulário de edição
  const [nome, setNome] = useState(dadosEmpresa.name)
  const [porte, setPorte] = useState<TamanhoEmpresa>(dadosEmpresa.size)
  const [cidade, setCidade] = useState(dadosEmpresa.city ?? '')
  const [estadoUf, setEstadoUf] = useState(dadosEmpresa.state ?? '')
  const [website, setWebsite] = useState(dadosEmpresa.website ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState('')

  function abrirEdicao() {
    setNome(dadosEmpresa.name)
    setPorte(dadosEmpresa.size)
    setCidade(dadosEmpresa.city ?? '')
    setEstadoUf(dadosEmpresa.state ?? '')
    setWebsite(dadosEmpresa.website ?? '')
    setErroSalvar('')
    setModalAberto(true)
  }

  async function handleSalvarPerfil(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setErroSalvar('O nome da empresa é obrigatório.')
      return
    }

    setSalvando(true)
    setErroSalvar('')

    try {
      const atualizada = await atualizarEmpresa(dadosEmpresa.id, {
        name: nome.trim(),
        size: porte,
        city: cidade.trim(),
        state: estadoUf.trim(),
        website: website.trim(),
      })
      setDadosEmpresa(atualizada)
      if (typeof definirConta === 'function') {
        definirConta(atualizada)
      }
      setModalAberto(false)
      setMensagemSucesso('Perfil da empresa atualizado com sucesso!')
      setTimeout(() => setMensagemSucesso(''), 4000)
    } catch {
      setErroSalvar('Não foi possível salvar as alterações. Verifique seus dados e tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Cabeçalho */}
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Meu perfil
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Gerencie os dados cadastrais, porte e canais de contato da sua organização na RecInTech.
        </p>
      </header>

      {mensagemSucesso && (
        <div className="flex items-center gap-2 rounded-xl border border-accent-300 bg-accent-100 p-4 text-sm font-medium text-ink-900">
          <CheckIcon className="size-5 text-accent-700" />
          {mensagemSucesso}
        </div>
      )}

      {/* 2. Seção de Dados do Cadastro */}
      <section id="cadastro" className="rounded-card bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <BuildingIcon className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Dados do cadastro</h2>
              <p className="text-xs text-ink-500">
                Informações institucionais visíveis para startups nas suas demandas publicadas
              </p>
            </div>
          </div>
          <Botao onClick={abrirEdicao}>Editar perfil</Botao>
        </div>

        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          <CampoVisualizacao rotulo="Nome da empresa" valor={dadosEmpresa.name} />
          <CampoVisualizacao
            rotulo="Porte empresarial"
            valor={PORTES[dadosEmpresa.size] ?? dadosEmpresa.size}
          />
          <CampoVisualizacao rotulo="CNPJ" valor={formatarCnpj(dadosEmpresa.cnpj)} />
          <CampoVisualizacao
            rotulo="Localização"
            valor={[dadosEmpresa.city, dadosEmpresa.state].filter(Boolean).join(', ')}
          />
          <CampoVisualizacao rotulo="Site oficial" valor={dadosEmpresa.website} link />
          <CampoVisualizacao rotulo="E-mail de acesso corporativo" valor={dadosEmpresa.email} />
          <CampoVisualizacao
            rotulo="Status da conta"
            valor={dadosEmpresa.is_active ? 'Conta ativa e verificada' : 'Pendente'}
          />
          <CampoVisualizacao
            rotulo="Data de cadastro"
            valor={formatarData(dadosEmpresa.created_at)}
          />
        </dl>
      </section>

      {/* 3. Seção de Governança, Privacidade e LGPD */}
      <section id="lgpd-empresa" className="rounded-card bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Governança e Privacidade (LGPD)</h2>
            <p className="mt-1 text-sm text-ink-500">
              Os dados corporativos da sua empresa estão protegidos segundo as diretrizes da LGPD e
              termos de uso da plataforma.
            </p>
          </div>
          <Link
            to="/privacidade/dados"
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-brand-50"
          >
            Gerenciar meus dados
          </Link>
        </div>
      </section>

      {/* 4. Modal de Edição de Perfil da Empresa */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-900/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-editar-perfil-empresa"
        >
          <div className="w-full max-w-lg rounded-2xl border border-brand-100 bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-100 pb-4">
              <h2
                id="titulo-editar-perfil-empresa"
                className="font-display text-lg font-bold text-ink-900"
              >
                Editar perfil da empresa
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
                id="edit-empresa-nome"
                label="Nome da empresa"
                required
                value={nome}
                onChange={setNome}
              />

              <CampoSelect
                id="edit-empresa-porte"
                label="Porte da organização"
                required
                value={porte}
                onChange={(v) => setPorte(v as TamanhoEmpresa)}
                opcoes={OPCOES_PORTE.map((p) => p.rotulo)}
                valores={OPCOES_PORTE.map((p) => p.valor)}
              />

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <CampoForm
                    id="edit-empresa-cidade"
                    label="Cidade"
                    value={cidade}
                    onChange={setCidade}
                  />
                </div>
                <div>
                  <CampoSelect
                    id="edit-empresa-estado"
                    label="UF"
                    value={estadoUf}
                    onChange={setEstadoUf}
                    opcoes={['Selecione', ...UFS.map((u) => u.valor)]}
                    valores={['', ...UFS.map((u) => u.valor)]}
                  />
                </div>
              </div>

              <CampoForm
                id="edit-empresa-website"
                label="Site / Website"
                type="url"
                placeholder="https://suaempresa.com.br"
                value={website}
                onChange={setWebsite}
              />

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
                  className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-brand-50 disabled:opacity-50"
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
    </div>
  )
}
