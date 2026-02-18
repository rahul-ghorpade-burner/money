import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export const LoginScreen = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true
    emailRef.current?.focus();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const errorMessage = await signIn(email, password);

    if (!mountedRef.current) return;
    if (errorMessage) {
      setError(errorMessage);
      setIsLoading(false);
    } else {
      setIsLoading(false)
    }
    // On success: onAuthStateChange in useAuth fires → ProtectedRoute redirects → component unmounts
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-large lowercase tracking-tight">money</h1>
          <p className="text-small text-text-muted mt-2">please sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} aria-label="sign in" className="space-y-4">
          <div>
            <input
              ref={emailRef}
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface border border-border p-3 text-body focus:outline-none focus:ring-2 focus:ring-text transition-all lowercase"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface border border-border p-3 text-body focus:outline-none focus:ring-2 focus:ring-text transition-all lowercase"
            />
          </div>

          {error && (
            <p aria-live="assertive" className="text-small text-error text-center lowercase">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-text text-bg p-3 text-body lowercase hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'signing in...' : 'sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};
