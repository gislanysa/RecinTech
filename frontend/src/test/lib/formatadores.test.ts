import { calcularTempoAtuacao } from '@/lib/formatadores.ts'
import { describe, expect, it } from 'vitest'

describe('Utilitários de formatação - calcularTempoAtuacao', () => {
  it('deve retornar mensagem padrão quando data for nula ou indefinida', () => {
    expect(calcularTempoAtuacao(null)).toBe('Tempo na plataforma não informado')
    expect(calcularTempoAtuacao(undefined)).toBe('Tempo na plataforma não informado')
    expect(calcularTempoAtuacao('')).toBe('Tempo na plataforma não informado')
  })

  it('deve retornar mensagem padrão para data inválida', () => {
    expect(calcularTempoAtuacao('data-invalida')).toBe('Tempo na plataforma não informado')
  })

  it('deve retornar "Recém-chegada na plataforma" para cadastro recente', () => {
    const agora = new Date()
    expect(calcularTempoAtuacao(agora.toISOString())).toBe('Recém-chegada na plataforma')
  })

  it('deve retornar meses na plataforma para período inferior a um ano', () => {
    const dataSeisMesesAtras = new Date()
    dataSeisMesesAtras.setMonth(dataSeisMesesAtras.getMonth() - 6)
    expect(calcularTempoAtuacao(dataSeisMesesAtras.toISOString())).toBe('6 meses na plataforma')
  })

  it('deve retornar anos na plataforma para período superior a um ano', () => {
    const dataDoisAnosAtras = new Date()
    dataDoisAnosAtras.setFullYear(dataDoisAnosAtras.getFullYear() - 2)
    expect(calcularTempoAtuacao(dataDoisAnosAtras.toISOString())).toBe('2 anos na plataforma')

    const dataUmAnoAtras = new Date()
    dataUmAnoAtras.setFullYear(dataUmAnoAtras.getFullYear() - 1)
    expect(calcularTempoAtuacao(dataUmAnoAtras.toISOString())).toBe('1 ano na plataforma')
  })
})
