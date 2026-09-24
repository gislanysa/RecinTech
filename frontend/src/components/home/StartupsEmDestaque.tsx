export default function StartupsEmDestaque() {
  return (
    <section id="destaques" className="scroll-mt-16 bg-surface py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Startups em destaque</h2>

        {/* Os cards entram aqui, alimentados por `GET /startups`. */}
      </div>
    </section>
  )
}
