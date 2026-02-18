import { Routes, Route, Navigate } from 'react-router';
import App from '../App';
import { LoginScreen } from '../components/LoginScreen';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { useAuth } from '../hooks/useAuth';
import { useConfig } from '../hooks/useConfig';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-bg text-text font-mono">
        <p className="text-small lowercase">loading...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const ConfigGate = ({ children }: { children: React.ReactNode }) => {
  const { config, isLoading } = useConfig();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-bg text-text font-mono">
        <p className="text-small lowercase">loading...</p>
      </div>
    );
  }

  if (config === null) {
    return <OnboardingScreen />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-bg text-text font-mono">
        <p className="text-small lowercase">loading...</p>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><LoginScreen /></PublicRoute>} />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <ConfigGate>
            <App />
          </ConfigGate>
        </ProtectedRoute>
      }
    >
      {/* Protected nested routes will go here */}
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
