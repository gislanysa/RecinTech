import {
  adicionarAdmin,
  alternarStatusAdmin,
  alternarStatusEmpresaAdmin,
  autenticarAdminLocal,
  calcularMetricasGlobais,
  limparSessaoAdmin,
  obterAdmins,
  obterEmpresasAdmin,
  registrarContratacaoDesbloqueio,
  registrarContratacaoPlanoDestaque,
  salvarStatusStartupAdmin,
  sincronizarContaAdmin,
} from '@/lib/admin.ts'
import { salvarDemandaPublica } from '@/lib/demandas.ts'
import { beforeEach, describe, expect, it } from 'vitest'

describe('admin.ts - Gestão e Governança Administrativa no Frontend', () => {
  beforeEach(() => {
    localStorage.clear()
    limparSessaoAdmin()
  })

  it('deve carregar lista padrão de administradores', () => {
    const admins = obterAdmins()
    expect(admins.length).toBeGreaterThanOrEqual(2)
    expect(admins.some((a) => a.email === 'admin@recintech.com')).toBe(true)
  })

  it('deve permitir autenticar admin com sucesso e salvar sessão', () => {
    const admin = autenticarAdminLocal('admin@recintech.com', 'admin123456')
    expect(admin).toBeDefined()
    expect(admin.role).toBe('admin')
    expect(admin.email).toBe('admin@recintech.com')
  })

  it('deve rejeitar login com senha menor que 8 caracteres', () => {
    expect(() => {
      autenticarAdminLocal('admin@recintech.com', '123')
    }).toThrow('A senha precisa ter pelo menos 8 caracteres.')
  })

  it('deve permitir adicionar novo administrador', () => {
    const novo = adicionarAdmin({
      name: 'Mariana Silva',
      email: 'mariana.silva@recintech.com',
      cargo: 'Auditoria de Governança',
    })

    expect(novo.id).toBeDefined()
    expect(novo.email).toBe('mariana.silva@recintech.com')

    const atualizados = obterAdmins()
    expect(atualizados.some((a) => a.email === 'mariana.silva@recintech.com')).toBe(true)
  })

  it('não deve permitir adicionar administrador com e-mail duplicado', () => {
    expect(() => {
      adicionarAdmin({
        name: 'Duplicado',
        email: 'admin@recintech.com',
      })
    }).toThrow('Já existe um administrador cadastrado com este e-mail.')
  })

  it('não deve permitir desativar o Administrador Master', () => {
    expect(() => {
      alternarStatusAdmin('admin-master')
    }).toThrow('O Administrador Master principal não pode ser desativado.')
  })

  it('deve alternar status de empresa cadastrada', () => {
    sincronizarContaAdmin({
      id: 'empresa-real-1',
      name: 'Empresa Teste',
      size: 'medium',
      cnpj: '12345678000199',
      city: 'Recife',
      state: 'PE',
      email: 'teste@empresa.com',
    })

    const empresas = obterEmpresasAdmin()
    expect(empresas.length).toBe(1)
    const primeira = empresas[0]
    const statusOriginal = primeira.is_active

    const alterada = alternarStatusEmpresaAdmin(primeira.id)
    expect(alterada.is_active).toBe(!statusOriginal)
  })

  it('deve calcular métricas globais da plataforma e registrar contratações reais', () => {
    // Inicialmente sem dados fictícios: tudo começa zerado
    let metricas = calcularMetricasGlobais()
    expect(metricas.pacotesDestaqueContratados).toBe(0)
    expect(metricas.pacotesDesbloqueioContratados).toBe(0)
    expect(metricas.totalStartups).toBe(0)
    expect(metricas.totalEmpresas).toBe(0)
    expect(metricas.totalDemandas).toBe(0)
    expect(metricas.volumeFinanceiroTotal).toBe(0)

    // Cadastra usuários reais e demanda real
    sincronizarContaAdmin({ id: 'startup-real-1', name: 'Startup Inovadora', stage: 'traction' })
    sincronizarContaAdmin({ id: 'empresa-real-1', name: 'Indústria Alpha', size: 'big', email: 'alpha@ind.com' })
    salvarDemandaPublica({
      id: 'demanda-real-1',
      company_id: 'empresa-real-1',
      titulo: 'Desenvolvimento de IA',
      descricao: 'Projeto de visão computacional',
      segmento: 'Inteligência Artificial',
      servicos: ['Desenvolvimento'],
      tecnologias: ['Python'],
      orcamento: 60000,
      status: 'aberta',
      created_at: '2026-01-01',
    }, 'Indústria Alpha')

    // Contrata pacote de destaque para uma startup e desbloqueio para empresa
    registrarContratacaoPlanoDestaque('startup-real-1')
    registrarContratacaoDesbloqueio('empresa-real-1')
    salvarStatusStartupAdmin('startup-real-1', { is_active: true, emDestaque: true })

    metricas = calcularMetricasGlobais()
    expect(metricas.pacotesDestaqueContratados).toBe(1)
    expect(metricas.pacotesDesbloqueioContratados).toBe(1)
    expect(metricas.totalStartups).toBe(1)
    expect(metricas.totalEmpresas).toBe(1)
    expect(metricas.totalDemandas).toBe(1)
    expect(metricas.volumeFinanceiroTotal).toBe(60000)
    expect(metricas.totalAdmins).toBeGreaterThanOrEqual(2)
  })
})
