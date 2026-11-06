import Botao from '@/components/Botao.tsx'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

describe('Botao component', () => {
  it('deve renderizar como tag <button> com o texto fornecido', () => {
    render(<Botao>Clique Aqui</Botao>)
    const botao = screen.getByRole('button', { name: /Clique Aqui/i })
    expect(botao).toBeInTheDocument()
    expect(botao).toHaveAttribute('type', 'button')
  })

  it('deve suportar o atributo type="submit"', () => {
    render(<Botao type="submit">Enviar Formulário</Botao>)
    const botao = screen.getByRole('button', { name: /Enviar Formulário/i })
    expect(botao).toHaveAttribute('type', 'submit')
  })

  it('deve disparar a função onClick quando clicado', () => {
    const handleClick = vi.fn()
    render(<Botao onClick={handleClick}>Salvar</Botao>)

    const botao = screen.getByRole('button', { name: /Salvar/i })
    fireEvent.click(botao)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('deve respeitar a propriedade disabled e não disparar onClick', () => {
    const handleClick = vi.fn()
    render(
      <Botao disabled onClick={handleClick}>
        Desabilitado
      </Botao>,
    )

    const botao = screen.getByRole('button', { name: /Desabilitado/i })
    expect(botao).toBeDisabled()

    fireEvent.click(botao)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('deve renderizar como link de navegação quando a prop "to" for fornecida', () => {
    render(
      <MemoryRouter>
        <Botao to="/dashboard/empresa">Ir para Dashboard</Botao>
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: /Ir para Dashboard/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard/empresa')
  })

  it('deve aplicar classe de largura total quando bloco={true}', () => {
    render(<Botao bloco>Botão Bloco</Botao>)
    const botao = screen.getByRole('button', { name: /Botão Bloco/i })
    expect(botao.className).toContain('w-full')
    expect(botao.className).toContain('justify-center')
  })
})
