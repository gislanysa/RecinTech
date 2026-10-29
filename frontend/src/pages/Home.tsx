import Hero from '@/components/home/Hero.tsx'
import Footer from '@/components/layout/Footer.tsx'
import Header from '@/components/layout/Header.tsx'

export default function Home() {
  return (
    <>
      <Header overlay />
      <main>
        <Hero />
        {/* Falta o bloco de matchmaking, entre o hero e o rodapé.

            A vitrine de startups (`StartupsEmDestaque`) saiu daqui: enquanto o
            catálogo é só mock, expor nomes fictícios na página pública passa a
            impressão errada. O componente continua pronto para ser montado
            dentro da área logada. */}
      </main>
      <Footer />
    </>
  )
}
