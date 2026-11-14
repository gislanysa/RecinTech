import Botao from '@/components/Botao.tsx'
import { CloseIcon } from '@/components/icons.tsx'
import {
  buscarExpertises,
  buscarSegmentos,
  buscarServicos,
  buscarTecnologias,
  carregarTagsDetalhadasStartup,
  salvarTagsStartup,
  type ItemCatalogo,
  type TagsDetalhadasStartup,
} from '@/lib/catalogos.ts'
import type { Tags } from '@/lib/perfil.ts'
import { useEffect, useState } from 'react'

export type ItemSelecionado = {
  id: string
  name: string
  isCustom?: boolean
}

type ModalEditarTagsStartupProps = {
  aberto: boolean
  startupId: string
  aoFechar: () => void
  aoSalvarSucesso?: (tagsAtualizadas?: Tags) => void
}

function encontrarIdOutros(opcoes: ItemCatalogo[], fallbackId: string): string {
  const item = opcoes.find((o) => /outro/i.test(o.name))
  return item ? item.id : fallbackId
}

export default function ModalEditarTagsStartup({
  aberto,
  startupId,
  aoFechar,
  aoSalvarSucesso,
}: ModalEditarTagsStartupProps) {
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Catálogos disponíveis
  const [opcoesExpertises, setOpcoesExpertises] = useState<ItemCatalogo[]>([])
  const [opcoesServicos, setOpcoesServicos] = useState<ItemCatalogo[]>([])
  const [opcoesTecnologias, setOpcoesTecnologias] = useState<ItemCatalogo[]>([])
  const [opcoesSegmentos, setOpcoesSegmentos] = useState<ItemCatalogo[]>([])

  // IDs inicialmente atribuídos no backend
  const [iniciaisIds, setIniciaisIds] = useState<{
    expertises: string[]
    services: string[]
    technologies: string[]
    segments: string[]
  }>({
    expertises: [],
    services: [],
    technologies: [],
    segments: [],
  })

  // 1. Área de Atuação Principal (única)
  const [areaSelecionadaId, setAreaSelecionadaId] = useState<string>('')
  const [outraAreaTexto, setOutraAreaTexto] = useState<string>('')

  // 2. Serviços (múltiplos via dropdown)
  const [servicosSelecionados, setServicosSelecionados] = useState<ItemSelecionado[]>([])
  const [dropdownServico, setDropdownServico] = useState<string>('')
  const [outroServicoTexto, setOutroServicoTexto] = useState<string>('')

  // 3. Tecnologias (múltiplas via dropdown)
  const [tecnologiasSelecionadas, setTecnologiasSelecionadas] = useState<ItemSelecionado[]>([])
  const [dropdownTecnologia, setDropdownTecnologia] = useState<string>('')
  const [outraTecnologiaTexto, setOutraTecnologiaTexto] = useState<string>('')

  // 4. Segmentos (múltiplos via dropdown)
  const [segmentosSelecionados, setSegmentosSelecionados] = useState<ItemSelecionado[]>([])
  const [dropdownSegmento, setDropdownSegmento] = useState<string>('')
  const [outroSegmentoTexto, setOutroSegmentoTexto] = useState<string>('')

  useEffect(() => {
    if (!aberto) return

    let ativo = true
    setCarregando(true)
    setErro('')

    Promise.all([
      buscarExpertises(),
      buscarServicos(),
      buscarTecnologias(),
      buscarSegmentos(),
      carregarTagsDetalhadasStartup(startupId),
    ])
      .then(
        ([exps, servs, tecs, segs, atuais]: [
          ItemCatalogo[],
          ItemCatalogo[],
          ItemCatalogo[],
          ItemCatalogo[],
          TagsDetalhadasStartup,
        ]) => {
          if (!ativo) return

          setOpcoesExpertises(exps)
          setOpcoesServicos(servs)
          setOpcoesTecnologias(tecs)
          setOpcoesSegmentos(segs)

          const expIds = atuais.expertises.map((i) => i.id)
          const servIds = atuais.services.map((i) => i.id)
          const tecIds = atuais.technologies.map((i) => i.id)
          const segIds = atuais.segments.map((i) => i.id)

          setIniciaisIds({
            expertises: expIds,
            services: servIds,
            technologies: tecIds,
            segments: segIds,
          })

          // Configura área inicial
          if (atuais.expertises.length > 0) {
            const expInicial = atuais.expertises[0]
            const existeNoCatalogo = exps.some((e) => e.id === expInicial.id)
            if (existeNoCatalogo && !/outro/i.test(expInicial.name)) {
              setAreaSelecionadaId(expInicial.id)
              setOutraAreaTexto('')
            } else {
              setAreaSelecionadaId('__outros__')
              setOutraAreaTexto(expInicial.name)
            }
          } else {
            setAreaSelecionadaId('')
            setOutraAreaTexto('')
          }

          // Configura serviços, tecnologias e segmentos iniciais
          setServicosSelecionados(
            atuais.services.map((i) => ({ id: i.id, name: i.name })),
          )
          setTecnologiasSelecionadas(
            atuais.technologies.map((i) => ({ id: i.id, name: i.name })),
          )
          setSegmentosSelecionados(
            atuais.segments.map((i) => ({ id: i.id, name: i.name })),
          )
        },
      )
      .catch(() => {
        if (ativo) setErro('Não foi possível carregar as informações do perfil.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [aberto, startupId])

  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto, aoFechar])

  if (!aberto) return null

  // Manipuladores de Adição
  function adicionarServico() {
    if (!dropdownServico) return
    if (dropdownServico === '__outros__') {
      const nome = outroServicoTexto.trim()
      if (!nome) return
      const idOutros = encontrarIdOutros(opcoesServicos, 'custom-outro-servico')
      const novoId = `${idOutros}-custom-${Date.now()}`
      setServicosSelecionados((atuais) => [
        ...atuais.filter((item) => item.name.toLowerCase() !== nome.toLowerCase()),
        { id: novoId, name: nome, isCustom: true },
      ])
      setDropdownServico('')
      setOutroServicoTexto('')
    } else {
      const item = opcoesServicos.find((s) => s.id === dropdownServico)
      if (item && !servicosSelecionados.some((s) => s.id === item.id)) {
        setServicosSelecionados((atuais) => [...atuais, { id: item.id, name: item.name }])
      }
      setDropdownServico('')
    }
  }

  function adicionarTecnologia() {
    if (!dropdownTecnologia) return
    if (dropdownTecnologia === '__outros__') {
      const nome = outraTecnologiaTexto.trim()
      if (!nome) return
      const idOutros = encontrarIdOutros(opcoesTecnologias, 'custom-outro-tecnologia')
      const novoId = `${idOutros}-custom-${Date.now()}`
      setTecnologiasSelecionadas((atuais) => [
        ...atuais.filter((item) => item.name.toLowerCase() !== nome.toLowerCase()),
        { id: novoId, name: nome, isCustom: true },
      ])
      setDropdownTecnologia('')
      setOutraTecnologiaTexto('')
    } else {
      const item = opcoesTecnologias.find((t) => t.id === dropdownTecnologia)
      if (item && !tecnologiasSelecionadas.some((t) => t.id === item.id)) {
        setTecnologiasSelecionadas((atuais) => [...atuais, { id: item.id, name: item.name }])
      }
      setDropdownTecnologia('')
    }
  }

  function adicionarSegmento() {
    if (!dropdownSegmento) return
    if (dropdownSegmento === '__outros__') {
      const nome = outroSegmentoTexto.trim()
      if (!nome) return
      const idOutros = encontrarIdOutros(opcoesSegmentos, 'custom-outro-segmento')
      const novoId = `${idOutros}-custom-${Date.now()}`
      setSegmentosSelecionados((atuais) => [
        ...atuais.filter((item) => item.name.toLowerCase() !== nome.toLowerCase()),
        { id: novoId, name: nome, isCustom: true },
      ])
      setDropdownSegmento('')
      setOutroSegmentoTexto('')
    } else {
      const item = opcoesSegmentos.find((s) => s.id === dropdownSegmento)
      if (item && !segmentosSelecionados.some((s) => s.id === item.id)) {
        setSegmentosSelecionados((atuais) => [...atuais, { id: item.id, name: item.name }])
      }
      setDropdownSegmento('')
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro('')

    try {
      // Mapeamento dos IDs de expertises para o backend
      let expIds: string[] = []
      let areaNomeFinal = ''
      if (areaSelecionadaId === '__outros__') {
        areaNomeFinal = outraAreaTexto.trim() || 'Outros'
        const idOutros = encontrarIdOutros(opcoesExpertises, 'exp-default-outros')
        expIds = [idOutros]
      } else if (areaSelecionadaId) {
        expIds = [areaSelecionadaId]
        areaNomeFinal = opcoesExpertises.find((e) => e.id === areaSelecionadaId)?.name ?? ''
      }

      // Mapeamento dos IDs de serviços
      const servIds = servicosSelecionados.map((item) => {
        if (item.isCustom) {
          return encontrarIdOutros(opcoesServicos, 'serv-default-outros')
        }
        return item.id
      })

      // Mapeamento dos IDs de tecnologias
      const tecIds = tecnologiasSelecionadas.map((item) => {
        if (item.isCustom) {
          return encontrarIdOutros(opcoesTecnologias, 'tec-default-outros')
        }
        return item.id
      })

      // Mapeamento dos IDs de segmentos
      const segIds = segmentosSelecionados.map((item) => {
        if (item.isCustom) {
          return encontrarIdOutros(opcoesSegmentos, 'seg-default-outros')
        }
        return item.id
      })

      // Salva no backend
      await salvarTagsStartup(
        startupId,
        {
          expertises: expIds,
          services: servIds,
          technologies: tecIds,
          segments: segIds,
        },
        iniciaisIds,
      )

      if (aoSalvarSucesso) {
        aoSalvarSucesso({
          area: areaNomeFinal,
          services: servicosSelecionados.map((s) => s.name),
          technologies: tecnologiasSelecionadas.map((t) => t.name),
          segments: segmentosSelecionados.map((s) => s.name),
        })
      }

      aoFechar()
    } catch {
      setErro('Ocorreu um erro ao atualizar as informações. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-tags-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={aoFechar}
        className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm transition-opacity"
      />

      {/* Conteúdo do Modal */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-surface p-6 shadow-2xl ring-1 ring-brand-100 sm:p-8">
        <div className="flex items-center justify-between border-b border-brand-100 pb-4">
          <div>
            <h2 id="modal-tags-titulo" className="font-display text-xl font-bold text-ink-900 sm:text-2xl">
              Editar áreas, serviços e tecnologias
            </h2>
            <p className="mt-1 text-xs text-ink-500 sm:text-sm">
              Selecione as opções nos menus suspensos. Caso selecione &quot;Outros&quot;, especifique o que sua startup oferece.
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

        {carregando ? (
          <div className="flex flex-1 items-center justify-center py-12 text-sm text-ink-500">
            Carregando catálogos e marcações…
          </div>
        ) : (
          <form onSubmit={handleSalvar} className="flex-1 overflow-y-auto py-5 pr-1">
            {erro && (
              <p className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
                {erro}
              </p>
            )}

            <div className="flex flex-col gap-6">
              {/* 1. Área de Atuação Principal (Dropdown simples com Outros) */}
              <div className="flex flex-col gap-2">
                <label htmlFor="select-area-atuacao" className="text-sm font-semibold text-ink-900">
                  Área de atuação principal
                </label>
                <p className="text-xs text-ink-500">
                  Selecione o campo de especialidade central da sua startup.
                </p>
                <select
                  id="select-area-atuacao"
                  value={areaSelecionadaId}
                  onChange={(e) => {
                    setAreaSelecionadaId(e.target.value)
                    if (erro) setErro('')
                  }}
                  className="w-full rounded-xl border border-brand-200 bg-surface px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-accent-500"
                >
                  <option value="">Selecione uma área de atuação...</option>
                  {opcoesExpertises
                    .filter((e) => !/outro/i.test(e.name))
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  <option value="__outros__">Outros</option>
                </select>

                {areaSelecionadaId === '__outros__' && (
                  <div className="mt-1 flex flex-col gap-1.5 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 p-3">
                    <label htmlFor="input-outra-area" className="text-xs font-medium text-ink-700">
                      Especifique sua área de atuação:
                    </label>
                    <input
                      id="input-outra-area"
                      type="text"
                      value={outraAreaTexto}
                      onChange={(e) => setOutraAreaTexto(e.target.value)}
                      placeholder="Ex.: Biotecnologia, Aeroespacial, Nanotecnologia..."
                      className="w-full rounded-xl border border-brand-200 bg-surface px-3.5 py-2 text-sm text-ink-900 outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-accent-500"
                    />
                  </div>
                )}
              </div>

              {/* 2. Serviços prestados (Dropdown com Adicionar e Outros) */}
              <div className="flex flex-col gap-2">
                <label htmlFor="select-servicos" className="text-sm font-semibold text-ink-900">
                  Serviços prestados
                </label>
                <p className="text-xs text-ink-500">
                  Selecione os projetos e serviços que sua equipe desenvolve.
                </p>
                <div className="flex gap-2">
                  <select
                    id="select-servicos"
                    value={dropdownServico}
                    onChange={(e) => {
                      setDropdownServico(e.target.value)
                      if (erro) setErro('')
                    }}
                    className="flex-1 rounded-xl border border-brand-200 bg-surface px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-accent-500"
                  >
                    <option value="">Selecione um serviço para adicionar...</option>
                    {opcoesServicos
                      .filter(
                        (s) =>
                          !/outro/i.test(s.name) &&
                          !servicosSelecionados.some((sel) => sel.id === s.id),
                      )
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    <option value="__outros__">Outros</option>
                  </select>
                  {dropdownServico && dropdownServico !== '__outros__' && (
                    <button
                      type="button"
                      onClick={adicionarServico}
                      className="rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      Adicionar
                    </button>
                  )}
                </div>

                {dropdownServico === '__outros__' && (
                  <div className="mt-1 flex flex-col gap-1.5 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 p-3">
                    <label htmlFor="input-outro-servico" className="text-xs font-medium text-ink-700">
                      Especifique o outro serviço:
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="input-outro-servico"
                        type="text"
                        value={outroServicoTexto}
                        onChange={(e) => setOutroServicoTexto(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            adicionarServico()
                          }
                        }}
                        placeholder="Ex.: Automação Comercial, Chatbots personalizados..."
                        className="flex-1 rounded-xl border border-brand-200 bg-surface px-3.5 py-2 text-sm text-ink-900 outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-accent-500"
                      />
                      <button
                        type="button"
                        onClick={adicionarServico}
                        className="rounded-xl bg-accent-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-700"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de serviços selecionados */}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {servicosSelecionados.length === 0 ? (
                    <span className="text-xs italic text-ink-400">Nenhum serviço selecionado ainda.</span>
                  ) : (
                    servicosSelecionados.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-200"
                      >
                        <span>{item.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setServicosSelecionados((atuais) =>
                              atuais.filter((s) => s.id !== item.id),
                            )
                          }
                          aria-label={`Remover serviço ${item.name}`}
                          className="grid size-4 place-items-center rounded-full text-brand-600 hover:bg-brand-200 hover:text-brand-900"
                        >
                          <CloseIcon className="size-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* 3. Tecnologias e Stacks (Dropdown com Adicionar e Outros) */}
              <div className="flex flex-col gap-2">
                <label htmlFor="select-tecnologias" className="text-sm font-semibold text-ink-900">
                  Tecnologias e Stacks
                </label>
                <p className="text-xs text-ink-500">
                  Linguagens, frameworks e tecnologias dominadas pela startup.
                </p>
                <div className="flex gap-2">
                  <select
                    id="select-tecnologias"
                    value={dropdownTecnologia}
                    onChange={(e) => {
                      setDropdownTecnologia(e.target.value)
                      if (erro) setErro('')
                    }}
                    className="flex-1 rounded-xl border border-brand-200 bg-surface px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-accent-500"
                  >
                    <option value="">Selecione uma tecnologia para adicionar...</option>
                    {opcoesTecnologias
                      .filter(
                        (t) =>
                          !/outro/i.test(t.name) &&
                          !tecnologiasSelecionadas.some((sel) => sel.id === t.id),
                      )
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    <option value="__outros__">Outros</option>
                  </select>
                  {dropdownTecnologia && dropdownTecnologia !== '__outros__' && (
                    <button
                      type="button"
                      onClick={adicionarTecnologia}
                      className="rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      Adicionar
                    </button>
                  )}
                </div>

                {dropdownTecnologia === '__outros__' && (
                  <div className="mt-1 flex flex-col gap-1.5 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 p-3">
                    <label htmlFor="input-outra-tecnologia" className="text-xs font-medium text-ink-700">
                      Especifique a outra tecnologia:
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="input-outra-tecnologia"
                        type="text"
                        value={outraTecnologiaTexto}
                        onChange={(e) => setOutraTecnologiaTexto(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            adicionarTecnologia()
                          }
                        }}
                        placeholder="Ex.: Flutter, Go, Rust, GraphQL..."
                        className="flex-1 rounded-xl border border-brand-200 bg-surface px-3.5 py-2 text-sm text-ink-900 outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-accent-500"
                      />
                      <button
                        type="button"
                        onClick={adicionarTecnologia}
                        className="rounded-xl bg-accent-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-700"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de tecnologias selecionadas */}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {tecnologiasSelecionadas.length === 0 ? (
                    <span className="text-xs italic text-ink-400">Nenhuma tecnologia selecionada ainda.</span>
                  ) : (
                    tecnologiasSelecionadas.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1 text-xs font-medium text-accent-800 ring-1 ring-accent-200"
                      >
                        <span>{item.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setTecnologiasSelecionadas((atuais) =>
                              atuais.filter((t) => t.id !== item.id),
                            )
                          }
                          aria-label={`Remover tecnologia ${item.name}`}
                          className="grid size-4 place-items-center rounded-full text-accent-600 hover:bg-accent-200 hover:text-accent-900"
                        >
                          <CloseIcon className="size-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* 4. Segmentos de mercado (Dropdown com Adicionar e Outros) */}
              <div className="flex flex-col gap-2">
                <label htmlFor="select-segmentos" className="text-sm font-semibold text-ink-900">
                  Segmentos de mercado
                </label>
                <p className="text-xs text-ink-500">
                  Mercados verticais aos quais suas soluções se destinam.
                </p>
                <div className="flex gap-2">
                  <select
                    id="select-segmentos"
                    value={dropdownSegmento}
                    onChange={(e) => {
                      setDropdownSegmento(e.target.value)
                      if (erro) setErro('')
                    }}
                    className="flex-1 rounded-xl border border-brand-200 bg-surface px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-accent-500"
                  >
                    <option value="">Selecione um segmento para adicionar...</option>
                    {opcoesSegmentos
                      .filter(
                        (s) =>
                          !/outro/i.test(s.name) &&
                          !segmentosSelecionados.some((sel) => sel.id === s.id),
                      )
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    <option value="__outros__">Outros</option>
                  </select>
                  {dropdownSegmento && dropdownSegmento !== '__outros__' && (
                    <button
                      type="button"
                      onClick={adicionarSegmento}
                      className="rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      Adicionar
                    </button>
                  )}
                </div>

                {dropdownSegmento === '__outros__' && (
                  <div className="mt-1 flex flex-col gap-1.5 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 p-3">
                    <label htmlFor="input-outro-segmento" className="text-xs font-medium text-ink-700">
                      Especifique o outro segmento:
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="input-outro-segmento"
                        type="text"
                        value={outroSegmentoTexto}
                        onChange={(e) => setOutroSegmentoTexto(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            adicionarSegmento()
                          }
                        }}
                        placeholder="Ex.: Govtech, Creator Economy, Foodtech..."
                        className="flex-1 rounded-xl border border-brand-200 bg-surface px-3.5 py-2 text-sm text-ink-900 outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-accent-500"
                      />
                      <button
                        type="button"
                        onClick={adicionarSegmento}
                        className="rounded-xl bg-accent-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-700"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de segmentos selecionados */}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {segmentosSelecionados.length === 0 ? (
                    <span className="text-xs italic text-ink-400">Nenhum segmento selecionado ainda.</span>
                  ) : (
                    segmentosSelecionados.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-200"
                      >
                        <span>{item.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setSegmentosSelecionados((atuais) =>
                              atuais.filter((s) => s.id !== item.id),
                            )
                          }
                          aria-label={`Remover segmento ${item.name}`}
                          className="grid size-4 place-items-center rounded-full text-brand-600 hover:bg-brand-200 hover:text-brand-900"
                        >
                          <CloseIcon className="size-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 border-t border-brand-100 pt-4">
              <button
                type="button"
                onClick={aoFechar}
                disabled={salvando}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-brand-50"
              >
                Cancelar
              </button>
              <Botao type="submit" disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar'}
              </Botao>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
