import { useState } from 'react'
import { Outlet } from 'react-router'
import { useAuth } from './hooks/useAuth'

function App() {
  const { signOut } = useAuth()
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      setSignOutError('sign out failed, try again')
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg text-text font-mono">
      <header className="p-4 border-b border-border flex justify-between items-center">
        <span className="text-large lowercase tracking-tight">money</span>
        <button onClick={handleSignOut} className="text-small text-text-muted hover:text-text lowercase">logout</button>
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
      {/* InputBar will go here in the future */}
    </div>
  )
}

export default App
