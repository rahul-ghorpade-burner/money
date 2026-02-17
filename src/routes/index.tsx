import { Routes, Route, Navigate } from 'react-router';
import App from '../App';
import { LoginScreen } from '../components/LoginScreen';
import { useAuth } from '../hooks/useAuth';

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

export const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginScreen />} />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <App />
        </ProtectedRoute>
      }
    >
      {/* Protected nested routes will go here */}
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
