import EscolhaTipo from '@/components/signup/EscolhaTipo.tsx'
import FormularioEmpresa from '@/components/signup/FormularioEmpresa.tsx'
import FormularioStartup from '@/components/signup/FormularioStartup.tsx'
import Logo from '@/components/Logo.tsx'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

type TipoConta = 'startup' | 'empresa'
type Step = 'escolha' | 'formulario'

function tipoDaUrl(valor: string | null): TipoConta | null {
  return valor === 'startup' || valor === 'empresa' ? valor : null
}

export default function CriarConta() {
  const [params] = useSearchParams()
  const tipoPreSelecionado = tipoDaUrl(params.get('tipo'))

  const [step, setStep] = useState<Step>(tipoPreSelecionado ? 'formulario' : 'escolha')
  const [tipo, setTipo] = useState<TipoConta | null>(tipoPreSelecionado)

  function handleEscolher(t: TipoConta) {
    setTipo(t)
    setStep('formulario')
  }

  function handleVoltar() {
    setStep('escolha')
    setTipo(null)
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-canvas">
      {/* Gradiente de fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(70%_55%_at_15%_0%,var(--color-brand-100),transparent_65%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-24 right-0 size-[32rem] rounded-full bg-[radial-gradient(circle,var(--color-accent-100),transparent_65%)] opacity-70 blur-3xl"
      />

      {/* Cabeçalho simples */}
      <header className="relative z-10 flex h-16 items-center border-b border-brand-100 bg-surface/80 px-4 backdrop-blur-xl sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Voltar para a home">
          <Logo />
        </Link>

        {/* Barra de progresso */}
        <div className="ml-auto flex items-center gap-3">
          <ol className="flex items-center gap-2" aria-label="Etapas do cadastro">
            <li className="flex items-center gap-2">
              <span
                className={[
                  'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                  step === 'escolha'
                    ? 'bg-brand-600 text-white'
                    : 'bg-brand-100 text-brand-600',
                ].join(' ')}
                aria-current={step === 'escolha' ? 'step' : undefined}
              >
                1
              </span>
              <span className="hidden text-xs text-ink-500 sm:inline">Tipo de conta</span>
            </li>
            <li aria-hidden="true">
              <div className="h-px w-8 bg-brand-200" />
            </li>
            <li className="flex items-center gap-2">
              <span
                className={[
                  'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                  step === 'formulario'
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface text-ink-500 ring-1 ring-brand-200',
                ].join(' ')}
                aria-current={step === 'formulario' ? 'step' : undefined}
              >
                2
              </span>
              <span className="hidden text-xs text-ink-500 sm:inline">Dados do cadastro</span>
            </li>
          </ol>
        </div>
      </header>

      {/* Conteúdo central */}
      <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-2xl border border-brand-100 bg-surface/90 p-6 shadow-xl shadow-ink-900/5 backdrop-blur-sm sm:p-10">
          {step === 'escolha' && <EscolhaTipo onEscolher={handleEscolher} />}
          {step === 'formulario' && tipo === 'startup' && <FormularioStartup onVoltar={handleVoltar} />}
          {step === 'formulario' && tipo === 'empresa' && <FormularioEmpresa onVoltar={handleVoltar} />}
        </div>
      </main>

      {/* Rodapé */}
      <footer className="relative z-10 py-6 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} RecInTech. Todos os direitos reservados.
      </footer>
    </div>
  )
}
