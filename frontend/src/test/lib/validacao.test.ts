import {
  apenasDigitos,
  cnpjCom14Digitos,
  email,
  emailValido,
  formatarCnpj,
  igualA,
  mapearErroApi,
  minimo,
  obrigatorio,
  validarCampos,
} from '@/lib/validacao.ts'
import { describe, expect, it } from 'vitest'

describe('validacao.ts - Funções utilitárias', () => {
  describe('emailValido', () => {
    it('deve retornar true para e-mails válidos', () => {
      expect(emailValido('usuario@empresa.com.br')).toBe(true)
      expect(emailValido('contato@startup.io')).toBe(true)
      expect(emailValido('teste.nome+alias@sub.dominio.org')).toBe(true)
    })

    it('deve retornar false para e-mails inválidos', () => {
      expect(emailValido('')).toBe(false)
      expect(emailValido('emailsemarroba.com')).toBe(false)
      expect(emailValido('@semusuario.com')).toBe(false)
      expect(emailValido('semdominio@')).toBe(false)
      expect(emailValido('invalido@dominio')).toBe(false)
      expect(emailValido('com espaco@dominio.com')).toBe(false)
    })
  })

  describe('apenasDigitos', () => {
    it('deve extrair apenas dígitos numéricos de uma string', () => {
      expect(apenasDigitos('12.345.678/0001-90')).toBe('12345678000190')
      expect(apenasDigitos('(81) 98765-4321')).toBe('81987654321')
      expect(apenasDigitos('Texto Sem Numeros')).toBe('')
      expect(apenasDigitos('')).toBe('')
    })
  })

  describe('formatarCnpj', () => {
    it('deve formatar CNPJ completo com pontuação correta', () => {
      expect(formatarCnpj('12345678000190')).toBe('12.345.678/0001-90')
    })

    it('deve formatar progressivamente durante a digitação', () => {
      expect(formatarCnpj('12')).toBe('12')
      expect(formatarCnpj('123')).toBe('12.3')
      expect(formatarCnpj('123456')).toBe('12.345.6')
      expect(formatarCnpj('123456780001')).toBe('12.345.678/0001')
      expect(formatarCnpj('1234567800019')).toBe('12.345.678/0001-9')
    })

    it('deve limitar a formatação ao tamanho máximo de 14 dígitos', () => {
      expect(formatarCnpj('1234567800019099999')).toBe('12.345.678/0001-90')
    })
  })
})

describe('validacao.ts - Regras e validação declarativa', () => {
  type FormularioTeste = {
    nome: string
    email: string
    cnpj: string
    senha: string
    confirmacao: string
  }

  it('deve validar regra obrigatorio', () => {
    const regraComAparar = obrigatorio<FormularioTeste>('Nome é obrigatório')
    const regraSemAparar = obrigatorio<FormularioTeste>('Senha é obrigatória', false)

    expect(regraComAparar('', { nome: '', email: '', cnpj: '', senha: '', confirmacao: '' })).toBe('Nome é obrigatório')
    expect(regraComAparar('   ', { nome: '   ', email: '', cnpj: '', senha: '', confirmacao: '' })).toBe('Nome é obrigatório')
    expect(regraComAparar('Recintech', { nome: 'Recintech', email: '', cnpj: '', senha: '', confirmacao: '' })).toBeUndefined()

    // Sem aparar espaços (útil para senhas onde espaço pode ser caractere válido)
    expect(regraSemAparar('   ', { nome: '', email: '', cnpj: '', senha: '   ', confirmacao: '' })).toBeUndefined()
  })

  it('deve validar regra email', () => {
    const regra = email<FormularioTeste>('E-mail inválido')
    expect(regra('invalido', { nome: '', email: 'invalido', cnpj: '', senha: '', confirmacao: '' })).toBe('E-mail inválido')
    expect(regra('valido@recintech.com', { nome: '', email: 'valido@recintech.com', cnpj: '', senha: '', confirmacao: '' })).toBeUndefined()
  })

  it('deve validar regra cnpjCom14Digitos', () => {
    const regra = cnpjCom14Digitos<FormularioTeste>('CNPJ incompleto')
    expect(regra('12.345.678/0001', { nome: '', email: '', cnpj: '12.345.678/0001', senha: '', confirmacao: '' })).toBe('CNPJ incompleto')
    expect(regra('12.345.678/0001-90', { nome: '', email: '', cnpj: '12.345.678/0001-90', senha: '', confirmacao: '' })).toBeUndefined()
  })

  it('deve validar regra minimo', () => {
    const regra = minimo<FormularioTeste>(6, 'Mínimo de 6 caracteres')
    expect(regra('12345', { nome: '', email: '', cnpj: '', senha: '12345', confirmacao: '' })).toBe('Mínimo de 6 caracteres')
    expect(regra('123456', { nome: '', email: '', cnpj: '', senha: '123456', confirmacao: '' })).toBeUndefined()
  })

  it('deve validar regra igualA (ex: confirmação de senha)', () => {
    const regra = igualA<FormularioTeste>('senha', 'As senhas não coincidem')
    const camposDiferentes = { nome: '', email: '', cnpj: '', senha: 'senha123', confirmacao: 'senha456' }
    const camposIguais = { nome: '', email: '', cnpj: '', senha: 'senha123', confirmacao: 'senha123' }

    expect(regra(camposDiferentes.confirmacao, camposDiferentes)).toBe('As senhas não coincidem')
    expect(regra(camposIguais.confirmacao, camposIguais)).toBeUndefined()
  })

  it('deve validar conjunto de campos através de validarCampos', () => {
    const camposInvalidos: FormularioTeste = {
      nome: '',
      email: 'email-invalido',
      cnpj: '123',
      senha: '123',
      confirmacao: '456',
    }

    const erros = validarCampos(camposInvalidos, {
      nome: obrigatorio('Informe o nome'),
      email: [obrigatorio('Informe o e-mail'), email('E-mail inválido')],
      cnpj: cnpjCom14Digitos('CNPJ deve ter 14 dígitos'),
      senha: minimo(6, 'Senha deve ter no mínimo 6 caracteres'),
      confirmacao: igualA('senha', 'Confirmação deve ser igual à senha'),
    })

    expect(erros).toEqual({
      nome: 'Informe o nome',
      email: 'E-mail inválido',
      cnpj: 'CNPJ deve ter 14 dígitos',
      senha: 'Senha deve ter no mínimo 6 caracteres',
      confirmacao: 'Confirmação deve ser igual à senha',
    })
  })

  it('deve retornar objeto vazio quando todos os campos forem válidos', () => {
    const camposValidos: FormularioTeste = {
      nome: 'Empresa Teste',
      email: 'contato@empresa.com',
      cnpj: '12.345.678/0001-90',
      senha: 'senhaSegura123',
      confirmacao: 'senhaSegura123',
    }

    const erros = validarCampos(camposValidos, {
      nome: obrigatorio('Informe o nome'),
      email: email('E-mail inválido'),
      cnpj: cnpjCom14Digitos('CNPJ deve ter 14 dígitos'),
      senha: minimo(6, 'Mínimo de 6 caracteres'),
      confirmacao: igualA('senha', 'Senhas não conferem'),
    })

    expect(erros).toEqual({})
  })
})

describe('validacao.ts - Mapeamento de erros da API', () => {
  it('deve mapear conflito 409 de e-mail duplicado', () => {
    const erroMock = {
      isAxiosError: true,
      response: {
        status: 409,
        data: 'Email already exists',
      },
    }

    expect(mapearErroApi(erroMock)).toEqual({
      email: 'Este e-mail já está em uso.',
    })
  })

  it('deve mapear conflito 409 de CNPJ duplicado', () => {
    const erroMock = {
      isAxiosError: true,
      response: {
        status: 409,
        data: 'CNPJ already registered',
      },
    }

    expect(mapearErroApi(erroMock)).toEqual({
      cnpj: 'Este CNPJ já está cadastrado.',
    })
  })

  it('deve retornar erro genérico para outros status HTTP do Axios', () => {
    const erroMock = {
      isAxiosError: true,
      response: {
        status: 500,
        data: 'Internal server error',
      },
    }

    expect(mapearErroApi(erroMock)).toEqual({
      email: 'Erro ao cadastrar. Tente novamente.',
    })
  })

  it('deve retornar erro de conexão para erros que não são do Axios', () => {
    expect(mapearErroApi(new Error('Network error'))).toEqual({
      email: 'Erro ao conectar. Tente novamente.',
    })
    expect(mapearErroApi(null)).toEqual({
      email: 'Erro ao conectar. Tente novamente.',
    })
  })
})
