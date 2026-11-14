import { listarDemandas, type Demanda } from '@/lib/demandas.ts'
import { useCallback, useEffect, useState } from 'react'

export type UseDemandasOpcoes = {
  companyId?: string
  porPagina?: number
  paginaInicial?: number
}

export type UseDemandasRetorno = {
  demandas: Demanda[]
  carregando: boolean
  erro: string | null
  pagina: number
  setPagina: React.Dispatch<React.SetStateAction<number>>
  proximaPagina: () => void
  paginaAnterior: () => void
  temProximaPagina: boolean
  temPaginaAnterior: boolean
  recarregar: () => Promise<void>
  salvarDemandaLocal: (salva: Demanda) => void
  removerDemandaLocal: (id: string) => void
}

/**
 * Hook centralizado para carregar, paginar e atualizar demandas de uma empresa.
 *
 * Inclui proteção de paginação inteligente (peek à frente com `porPagina + 1`)
 * para evitar páginas finais em branco quando o total de demandas for múltiplo
 * exato do tamanho da página.
 */
export function useDemandas({
  companyId,
  porPagina,
  paginaInicial = 0,
}: UseDemandasOpcoes): UseDemandasRetorno {
  const [demandas, setDemandas] = useState<Demanda[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [pagina, setPagina] = useState(paginaInicial)
  const [temProximaPagina, setTemProximaPagina] = useState(false)

  const buscar = useCallback(
    async (ativoRef?: { current: boolean }) => {
      if (!companyId) {
        setDemandas([])
        setCarregando(false)
        return
      }

      setCarregando(true)
      setErro(null)

      try {
        if (typeof porPagina === 'number' && porPagina > 0) {
          // Busca limit + 1 para saber com certeza se há uma próxima página
          const limit = porPagina + 1
          const offset = pagina * porPagina
          const lista = await listarDemandas(companyId, limit, offset)

          if (ativoRef && !ativoRef.current) return

          if (lista.length > porPagina) {
            setTemProximaPagina(true)
            setDemandas(lista.slice(0, porPagina))
          } else {
            setTemProximaPagina(false)
            setDemandas(lista)

            // Se porventura a página for > 0 e a lista estiver vazia (ex.: exclusão),
            // retrocede para a página anterior
            if (pagina > 0 && lista.length === 0) {
              setPagina((p) => Math.max(0, p - 1))
            }
          }
        } else {
          // Sem paginação: busca todas as demandas
          const lista = await listarDemandas(companyId)
          if (ativoRef && !ativoRef.current) return
          setDemandas(lista)
          setTemProximaPagina(false)
        }
      } catch {
        if (ativoRef && !ativoRef.current) return
        setErro('Não foi possível carregar as demandas da empresa.')
      } finally {
        if (!ativoRef || ativoRef.current) {
          setCarregando(false)
        }
      }
    },
    [companyId, porPagina, pagina],
  )

  useEffect(() => {
    const ativoRef = { current: true }
    buscar(ativoRef)
    return () => {
      ativoRef.current = false
    }
  }, [buscar])

  const recarregar = useCallback(async () => {
    await buscar()
  }, [buscar])

  const proximaPagina = useCallback(() => {
    if (temProximaPagina && !carregando) {
      setPagina((p) => p + 1)
    }
  }, [temProximaPagina, carregando])

  const paginaAnterior = useCallback(() => {
    if (pagina > 0 && !carregando) {
      setPagina((p) => Math.max(0, p - 1))
    }
  }, [pagina, carregando])

  const salvarDemandaLocal = useCallback((salva: Demanda) => {
    setDemandas((prev) => {
      const index = prev.findIndex((d) => d.id === salva.id)
      if (index >= 0) {
        const copia = [...prev]
        copia[index] = salva
        return copia
      }
      return [salva, ...prev]
    })
  }, [])

  const removerDemandaLocal = useCallback((id: string) => {
    setDemandas((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return {
    demandas,
    carregando,
    erro,
    pagina,
    setPagina,
    proximaPagina,
    paginaAnterior,
    temProximaPagina,
    temPaginaAnterior: pagina > 0,
    recarregar,
    salvarDemandaLocal,
    removerDemandaLocal,
  }
}
