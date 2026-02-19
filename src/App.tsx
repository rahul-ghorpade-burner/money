import { useState } from 'react'
import { Outlet, Link } from 'react-router'
import { useAuth } from './hooks/useAuth'
import { InputBar } from './components/InputBar'
import { MonthContext, useMonthProvider } from './hooks/useMonth'

function App() {
  const { signOut } = useAuth()
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const monthValue = useMonthProvider()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      setSignOutError('sign out failed, try again')
    }
  }

  return (
    <MonthContext.Provider value={monthValue}>
      <div className="min-h-dvh flex flex-col bg-bg text-text font-mono">
        <header className="p-4 border-b border-border flex justify-between items-center">
          <span className="text-large lowercase tracking-tight">money</span>
          <nav className="flex items-center gap-4">
            <Link to="/settings" className="text-small text-text-muted hover:text-text lowercase">settings</Link>
            <button onClick={handleSignOut} className="text-small text-text-muted hover:text-text lowercase">logout</button>
          </nav>
        </header>
        {signOutError && (
          <p aria-live="assertive" className="text-small text-error text-center lowercase px-4 py-2">{signOutError}</p>
        )}
        <main className="flex-1 overflow-auto">
          <Outlet />
          <div className="p-8">
            <h1 className="text-large">money shell</h1>
            <p className="text-body text-text-muted mt-4">Welcome to your personal finance tracker.</p>
          </div>
        </main>
        <InputBar />
      </div>
    </MonthContext.Provider>
  )
}

export default App
