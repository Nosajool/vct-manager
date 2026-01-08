function App() {
  return (
    <div className="min-h-screen bg-vct-dark text-vct-light">
      <header className="bg-vct-darker border-b border-vct-gray/20 p-4">
        <h1 className="text-2xl font-bold text-vct-red">VCT Manager</h1>
      </header>
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl mb-4">Welcome to VCT Manager</h2>
          <p className="text-vct-gray">
            A Valorant Champions Tour management simulation game.
          </p>
          <div className="mt-8 p-4 bg-vct-darker rounded-lg border border-vct-gray/20">
            <h3 className="text-lg font-semibold mb-2">Phase 0: Foundation</h3>
            <ul className="list-disc list-inside text-vct-gray space-y-1">
              <li>Project setup complete</li>
              <li>Vite + React + TypeScript</li>
              <li>Zustand + Dexie + Tailwind</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
