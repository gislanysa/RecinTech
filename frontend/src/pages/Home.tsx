import Hero from '@/components/home/Hero.tsx'
import StartupsEmDestaque from '@/components/home/StartupsEmDestaque.tsx'
import Footer from '@/components/layout/Footer.tsx'
import Header from '@/components/layout/Header.tsx'

export default function Home() {
  return (
    <>
      <Header overlay />
      <main>
        <Hero />
        <StartupsEmDestaque />
        {/* Falta o bloco de matchmaking, entre os destaques e o rodapé. */}
      </main>
      <Footer />
    </>
  )
}
