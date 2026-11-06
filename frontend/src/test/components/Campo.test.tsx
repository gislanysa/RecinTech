import { Campo, CampoSelect } from '@/components/forms/Campo.tsx'
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

function CampoControladoWrapper(props: Partial<React.ComponentProps<typeof Campo>>) {
  const [valor, setValor] = useState(props.value ?? '')
  const { value: _v, onChange: _o, ...rest } = props
  return (
    <Campo
      id="campo-teste"
      label="Nome Completo"
      value={valor}
      onChange={(v) => {
        setValor(v)
        props.onChange?.(v)
      }}
      {...rest}
    />
  )
}

describe('Campo component', () => {
  it('deve renderizar o rótulo, input e placeholder corretamente', () => {
    render(
      <Campo
        id="nome"
        label="Nome Fantasia"
        value=""
        onChange={vi.fn()}
        placeholder="Digite o nome da startup"
      />,
    )

    expect(screen.getByLabelText(/Nome Fantasia/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Digite o nome da startup')).toBeInTheDocument()
  })

  it('deve indicar visualmente campo obrigatório com asterisco', () => {
    render(<Campo id="cnpj" label="CNPJ" value="" onChange={vi.fn()} required />)

    const rotulo = screen.getByText('CNPJ')
    expect(rotulo).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('deve exibir mensagem de erro e configurar atributos de acessibilidade (role="alert" e aria-invalid)', () => {
    render(
      <Campo
        id="email"
        label="E-mail"
        value="invalido"
        onChange={vi.fn()}
        error="Formato de e-mail inválido"
      />,
    )

    const input = screen.getByLabelText(/E-mail/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'email-error')

    const erro = screen.getByRole('alert')
    expect(erro).toBeInTheDocument()
    expect(erro).toHaveTextContent('Formato de e-mail inválido')
  })

  it('deve disparar onChange ao digitar no input', () => {
    const handleOnChange = vi.fn()
    render(<CampoControladoWrapper onChange={handleOnChange} />)

    const input = screen.getByLabelText(/Nome Completo/i)
    fireEvent.change(input, { target: { value: 'Recintech' } })

    expect(handleOnChange).toHaveBeenCalledWith('Recintech')
    expect(input).toHaveValue('Recintech')
  })

  it('deve alternar a visibilidade da senha quando alternarSenha for true', () => {
    render(
      <Campo
        id="senha"
        label="Senha"
        type="password"
        value="minhasenha123"
        onChange={vi.fn()}
        alternarSenha={true}
      />,
    )

    const input = screen.getByLabelText('Senha')
    expect(input).toHaveAttribute('type', 'password')

    const botaoAlternar = screen.getByRole('button', { name: /mostrar senha/i })
    expect(botaoAlternar).toBeInTheDocument()

    // Clica para mostrar a senha
    fireEvent.click(botaoAlternar)
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: /ocultar senha/i })).toBeInTheDocument()

    // Clica novamente para esconder
    fireEvent.click(screen.getByRole('button', { name: /ocultar senha/i }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('deve exibir texto de dica quando fornecido e não houver erro', () => {
    render(
      <Campo
        id="cnpj"
        label="CNPJ"
        value=""
        onChange={vi.fn()}
        dica="Informe apenas os 14 dígitos"
      />,
    )

    expect(screen.getByText('Informe apenas os 14 dígitos')).toBeInTheDocument()
  })
})

describe('CampoSelect component', () => {
  it('deve renderizar opções e disparar onChange na seleção', () => {
    const handleChange = vi.fn()
    const opcoes = ['Tecnologia', 'Reciclagem', 'Educação']

    render(
      <CampoSelect
        id="segmento"
        label="Segmento"
        value=""
        onChange={handleChange}
        opcoes={opcoes}
        placeholder="Selecione um segmento"
      />,
    )

    const select = screen.getByLabelText(/Segmento/i)
    expect(select).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Selecione um segmento' })).toBeDisabled()
    expect(screen.getByRole('option', { name: 'Reciclagem' })).toBeInTheDocument()

    fireEvent.change(select, { target: { value: 'Reciclagem' } })
    expect(handleChange).toHaveBeenCalledWith('Reciclagem')
  })
})
