import Botao from '@/components/Botao.tsx'
import type { ContextoSessao } from '@/components/RotaProtegida.tsx'
import { Campo, CampoSelect } from '@/components/forms/Campo.tsx'
import { CloseIcon } from '@/components/icons.tsx'
import type { Company } from '@/lib/api.ts'
import {
  buscarSegmentos,
  buscarServicos,
  buscarTecnologias,
  ehUuidReal,
  type ItemCatalogo,
} from '@/lib/catalogos.ts'
import { atualizarDemanda, criarDemanda, type Demanda, type StatusDemanda } from '@/lib/demandas.ts'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

type ModalNovaDemandaProps = {
  aberto: boolean
  companyId?: string
  demandaParaEditar?: Demanda | null
  aoFechar: () => void
  aoSalvar?: (demanda: Demanda) => void
  /** Suporte para aoCriar legado */
  aoCriar?: (nova: Demanda) => void
}

function FormularioDemanda({
  demandaParaEditar,
  companyId,
  aoFechar,
  aoSalvar,
}: {
  demandaParaEditar?: Demanda | null
  companyId?: string
  aoFechar: () => void
  aoSalvar: (demanda: Demanda) => void
}) {
  const [listaSegmentos, setListaSegmentos] = useState<ItemCatalogo[]>([])
  const [listaServicos, setListaServicos] = useState<ItemCatalogo[]>([])
  const [listaTecnologias, setListaTecnologias] = useState<ItemCatalogo[]>([])

  const [titulo, setTitulo] = useState(demandaParaEditar?.titulo ?? '')
  const [descricao, setDescricao] = useState(demandaParaEditar?.descricao ?? '')
  const [segmento, setSegmento] = useState(demandaParaEditar?.segmento ?? '')
  const [orcamento, setOrcamento] = useState(demandaParaEditar?.orcamento ? String(demandaParaEditar.orcamento) : '')
  const [status, setStatus] = useState<StatusDemanda>(
    demandaParaEditar?.status === 'closed' || demandaParaEditar?.status === 'encerrada'
      ? 'closed'
      : demandaParaEditar?.status === 'canceled' || demandaParaEditar?.status === 'cancelada'
        ? 'canceled'
        : 'open',
  )
  const [servicos, setServicos] = useState<string[]>(demandaParaEditar?.servicos ?? [])
  const [tecnologias, setTecnologias] = useState<string[]>(demandaParaEditar?.tecnologias ?? [])
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    Promise.all([buscarSegmentos(), buscarServicos(), buscarTecnologias()]).then(
      ([segs, servs, tecs]) => {
        if (!ativo) return
        setListaSegmentos(segs)
        setListaServicos(servs)
        setListaTecnologias(tecs)
      },
    )
    return () => {
      ativo = false
    }
  }, [])

  const isEdicao = Boolean(demandaParaEditar)

  function alternarServico(servico: string) {
    setServicos((atuais) =>
      atuais.includes(servico) ? atuais.filter((s) => s !== servico) : [...atuais, servico],
    )
  }

  function alternarTecnologia(tec: string) {
    setTecnologias((atuais) =>
      atuais.includes(tec) ? atuais.filter((t) => t !== tec) : [...atuais, tec],
    )
  }

  const contexto = useOutletContext<ContextoSessao | undefined>()
  const resolvedCompany = contexto?.conta as Company | undefined
  const resolvedCompanyId = companyId ?? resolvedCompany?.id
  const resolvedCompanyName = resolvedCompany?.name

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!resolvedCompanyId) {
      setErro('Identificador da empresa não disponível. Recarregue a página ou faça login novamente.')
      return
    }
    if (!titulo.trim()) {
      setErro('Informe o título da demanda.')
      return
    }
    if (!descricao.trim()) {
      setErro('Descreva a necessidade da empresa.')
      return
    }
    if (!segmento) {
      setErro('Selecione o segmento relacionado.')
      return
    }

    setErro('')
    setEnviando(true)

    // Captura os IDs reais dos itens de catálogo selecionados (apenas UUIDs reais que existam no banco)
    const segmentoItem = listaSegmentos.find((s) => s.name === segmento || s.id === segmento)
    const segmentIds = segmentoItem && ehUuidReal(segmentoItem.id)
      ? [segmentoItem.id]
      : ehUuidReal(segmento)
        ? [segmento]
        : []

    const serviceIds = servicos
      .map((sNomeOuId) => {
        const item = listaServicos.find((s) => s.name === sNomeOuId || s.id === sNomeOuId)
        return item?.id ?? (ehUuidReal(sNomeOuId) ? sNomeOuId : undefined)
      })
      .filter((id): id is string => Boolean(id && ehUuidReal(id)))

    const technologyIds = tecnologias
      .map((tNomeOuId) => {
        const item = listaTecnologias.find((t) => t.name === tNomeOuId || t.id === tNomeOuId)
        return item?.id ?? (ehUuidReal(tNomeOuId) ? tNomeOuId : undefined)
      })
      .filter((id): id is string => Boolean(id && ehUuidReal(id)))

    const orcamentoNumero = orcamento.trim() ? Number(orcamento) : undefined

    try {
      if (demandaParaEditar) {
        const atualizada = await atualizarDemanda(resolvedCompanyId, demandaParaEditar.id, {
          titulo,
          descricao,
          segmento,
          servicos,
          tecnologias,
          orcamento: orcamentoNumero,
          segmentIds,
          serviceIds,
          technologyIds,
          status,
          ...(resolvedCompanyName ? { empresa_nome: resolvedCompanyName } : {}),
        })
        aoSalvar(atualizada)
      } else {
        const nova = await criarDemanda(resolvedCompanyId, {
          titulo,
          descricao,
          segmento,
          servicos,
          tecnologias,
          orcamento: orcamentoNumero,
          segmentIds,
          serviceIds,
          technologyIds,
          status,
          ...(resolvedCompanyName ? { empresa_nome: resolvedCompanyName } : {}),
        })
        aoSalvar(nova)
      }
      aoFechar()
    } catch (err: unknown) {
      let mensagem = 'Não foi possível salvar a demanda. Tente novamente.'
      if (axios.isAxiosError(err)) {
        if (typeof err.response?.data === 'string' && err.response.data.trim()) {
          mensagem = `Erro do servidor: ${err.response.data.trim()}`
        } else if (err.response?.data?.message) {
          mensagem = `Erro do servidor: ${err.response.data.message}`
        } else if (err.response?.status === 404) {
          mensagem = 'Empresa ou catálogo não encontrado no servidor.'
        } else if (err.response?.status === 400) {
          mensagem = 'Dados inválidos enviados ao servidor. Verifique os campos.'
        }
      }
      setErro(mensagem)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-brand-100 pb-4">
        <div>
          <h2 id="modal-titulo" className="font-display text-xl font-bold text-ink-900 sm:text-2xl">
            {isEdicao ? 'Editar demanda' : 'Adicionar nova demanda'}
          </h2>
          <p className="mt-1 text-xs text-ink-500 sm:text-sm">
            {isEdicao
              ? 'Atualize os detalhes, requisitos e status da sua demanda tecnológica.'
              : 'Cadastre sua necessidade para receber recomendações inteligentes de startups compatíveis.'}
          </p>
        </div>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar modal"
          className="grid size-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-brand-50 hover:text-ink-900"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-5 pr-1">
        <div className="flex flex-col gap-5">
          <Campo
            id="demanda-titulo"
            label="Título da demanda"
            required
            value={titulo}
            onChange={(v) => {
              setTitulo(v)
              if (erro) setErro('')
            }}
            placeholder="Ex.: Rastreabilidade e Logística Reversa de Embalagens"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="demanda-descricao" className="text-sm font-medium text-ink-700">
              Descrição da necessidade <span className="text-accent-500">*</span>
            </label>
            <textarea
              id="demanda-descricao"
              rows={3}
              required
              value={descricao}
              onChange={(e) => {
                setDescricao(e.target.value)
                if (erro) setErro('')
              }}
              placeholder="Descreva o problema a ser resolvido, o contexto do projeto e os objetivos esperados..."
              className="w-full rounded-xl border border-brand-200 bg-surface px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-shadow placeholder:text-ink-500/60 focus:border-transparent focus:ring-2 focus:ring-accent-500"
            />
          </div>

          <CampoSelect
            id="demanda-segmento"
            label="Segmento de atuação"
            required
            value={segmento}
            onChange={(v) => {
              setSegmento(v)
              if (erro) setErro('')
            }}
            opcoes={listaSegmentos.map((s) => s.name)}
            placeholder="Selecione o segmento principal"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="demanda-orcamento" className="text-sm font-medium text-ink-700">
              Valor que a empresa está disposta a pagar (R$)
            </label>
            <input
              id="demanda-orcamento"
              type="number"
              min="0"
              step="500"
              value={orcamento}
              onChange={(e) => setOrcamento(e.target.value)}
              placeholder="Ex.: 30000"
              className="w-full rounded-xl border border-brand-200 bg-surface px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-shadow placeholder:text-ink-500/60 focus:border-transparent focus:ring-2 focus:ring-accent-500"
            />
            <p className="text-xs text-ink-500">
              A startup poderá aceitar esse valor ou propor uma contraproposta negociável.
            </p>
          </div>

          {isEdicao && (
            <CampoSelect
              id="demanda-status"
              label="Status da demanda"
              required
              value={status}
              onChange={(v) => setStatus(v as StatusDemanda)}
              opcoes={[
                'Aberta (Recebendo recomendações)',
                'Encerrada (Finalizada)',
                'Cancelada',
              ]}
              valores={['open', 'closed', 'canceled']}
            />
          )}

          {/* Serviços procurados */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-ink-700">
              Serviços procurados (opcional)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {listaServicos.map((s) => {
                const selecionado = servicos.includes(s.name)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => alternarServico(s.name)}
                    className={[
                      'rounded-full px-3 py-1 text-xs font-medium transition-all',
                      selecionado
                        ? 'bg-brand-600 text-white shadow-sm ring-1 ring-brand-700'
                        : 'bg-brand-50 text-ink-700 hover:bg-brand-100 ring-1 ring-brand-200',
                    ].join(' ')}
                  >
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tecnologias procuradas */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-ink-700">
              Tecnologias de interesse (opcional)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {listaTecnologias.slice(0, 16).map((t) => {
                const selecionado = tecnologias.includes(t.name)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => alternarTecnologia(t.name)}
                    className={[
                      'rounded-full px-3 py-1 text-xs font-medium transition-all',
                      selecionado
                        ? 'bg-accent-600 text-white shadow-sm ring-1 ring-accent-700'
                        : 'bg-surface text-ink-700 hover:bg-brand-50 ring-1 ring-brand-200',
                    ].join(' ')}
                  >
                    {t.name}
                  </button>
                )
              })}
            </div>
          </div>

          {erro && (
            <p role="alert" className="text-xs font-medium text-red-500">
              {erro}
            </p>
          )}
        </div>

        <div className="mt-8 flex items-center justify-end gap-3 border-t border-brand-100 pt-4">
          <button
            type="button"
            onClick={aoFechar}
            disabled={enviando}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-brand-50"
          >
            Cancelar
          </button>
          <Botao type="submit" disabled={enviando}>
            {enviando
              ? isEdicao
                ? 'Salvando alterações…'
                : 'Cadastrando demanda…'
              : isEdicao
                ? 'Salvar alterações'
                : 'Cadastrar demanda'}
          </Botao>
        </div>
      </form>
    </>
  )
}

export default function ModalNovaDemanda({
  aberto,
  companyId,
  demandaParaEditar,
  aoFechar,
  aoSalvar,
  aoCriar,
}: ModalNovaDemandaProps) {
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto, aoFechar])

  if (!aberto) return null

  const handleSalvar = (demanda: Demanda) => {
    if (aoSalvar) aoSalvar(demanda)
    else if (aoCriar) aoCriar(demanda)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={aoFechar}
        className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm transition-opacity"
      />

      {/* Conteúdo do Modal */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-surface p-6 shadow-2xl ring-1 ring-brand-100 sm:p-8">
        <FormularioDemanda
          key={demandaParaEditar ? demandaParaEditar.id : 'nova'}
          demandaParaEditar={demandaParaEditar}
          companyId={companyId}
          aoFechar={aoFechar}
          aoSalvar={handleSalvar}
        />
      </div>
    </div>
  )
}
