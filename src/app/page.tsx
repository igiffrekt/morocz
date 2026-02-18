export default function Home() {
  return (
    <main className="max-w-[88rem] mx-auto px-8 py-12 space-y-12">
      <h1 className="text-3xl font-bold text-primary">
        Morocz Medical — Dizájn Rendszer Teszt
      </h1>

      {/* Color Swatches */}
      <section>
        <h2 className="text-xl font-semibold text-text-light mb-4">Szín tokenek</h2>
        <div className="flex flex-wrap gap-4">
          {[
            { name: "primary", cls: "bg-primary" },
            { name: "secondary", cls: "bg-secondary" },
            { name: "accent", cls: "bg-accent" },
            { name: "yellow-card", cls: "bg-yellow-card" },
            { name: "green-card", cls: "bg-green-card" },
            { name: "purple-card", cls: "bg-purple-card" },
            { name: "blue-card", cls: "bg-blue-card" },
            { name: "background-light", cls: "bg-background-light border border-gray-300" },
          ].map(({ name, cls }) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div className={`w-20 h-20 rounded-xl ${cls}`} />
              <span className="text-sm font-medium text-text-light">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Border Radius */}
      <section>
        <h2 className="text-xl font-semibold text-text-light mb-4">Sarkok lekerekítése</h2>
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 bg-primary rounded" />
            <span className="text-sm font-medium">rounded (1rem)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 bg-primary rounded-xl" />
            <span className="text-sm font-medium">rounded-xl (1.5rem)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 bg-primary rounded-2xl" />
            <span className="text-sm font-medium">rounded-2xl (2rem)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 bg-primary rounded-3xl" />
            <span className="text-sm font-medium">rounded-3xl (2.5rem)</span>
          </div>
        </div>
      </section>

      {/* Font Weights */}
      <section>
        <h2 className="text-xl font-semibold text-text-light mb-4">Plus Jakarta Sans betűsúlyok</h2>
        <div className="space-y-2">
          <p className="font-normal text-lg text-text-light">400 — Normal súly (Egészségügyi ellátás)</p>
          <p className="font-medium text-lg text-text-light">500 — Közepes súly (Egészségügyi ellátás)</p>
          <p className="font-semibold text-lg text-text-light">600 — Félkövér súly (Egészségügyi ellátás)</p>
          <p className="font-bold text-lg text-text-light">700 — Kövér súly (Egészségügyi ellátás)</p>
          <p className="font-extrabold text-lg text-text-light">800 — Extra kövér súly (Egészségügyi ellátás)</p>
        </div>
      </section>

      {/* Max Width Test */}
      <section>
        <h2 className="text-xl font-semibold text-text-light mb-4">Max szélesség (88rem)</h2>
        <div className="bg-secondary rounded-2xl p-6">
          <p className="text-text-light font-medium">
            Ez a tároló a max-w-[88rem] korlátozással rendelkezik, ami a sablon 88rem max-szélessége.
          </p>
        </div>
      </section>
    </main>
  );
}
