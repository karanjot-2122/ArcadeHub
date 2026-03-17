import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import QuickPlay from './pages/QuickPlay';
import Profile from './pages/Profile';
import { AuthProvider, AuthContext } from './contexts/AuthContext';

function AppRoutes() {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/quickplay" replace /> : <Auth initialMode="login" />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/quickplay" replace /> : <Auth initialMode="login" />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/quickplay" replace /> : <Auth initialMode="register" />}
      />
      <Route
        path="/quickplay"
        element={isAuthenticated ? <QuickPlay /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/profile"
        element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="container mx-auto mt-10 p-4">
          <AppRoutes />
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;