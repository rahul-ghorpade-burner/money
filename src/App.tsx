import { Outlet } from 'react-router'

function App() {
  return (
    <div className="min-h-dvh flex flex-col bg-bg text-text font-mono">
      {/* AppHeader will go here in the future */}
      <main className="flex-1 overflow-auto">
        <Outlet />
        <div className="p-8">
          <h1 className="text-large">money shell</h1>
          <p className="text-body text-text-muted mt-4">Welcome to your personal finance tracker.</p>
        </div>
      </main>
      {/* InputBar will go here in the future */}
    </div>
  )
}

export default App
