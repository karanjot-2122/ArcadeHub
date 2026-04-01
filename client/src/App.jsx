import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import QuickPlay from './pages/QuickPlay';
import GlobalChat from './pages/GlobalChat';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import Rooms from './pages/Rooms';
import RoomLobby from './pages/RoomLobby';
import GameRuntime from './pages/GameRuntime';
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
        path="/global-chat"
        element={isAuthenticated ? <GlobalChat /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/profile"
        element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/friends"
        element={isAuthenticated ? <Friends /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/rooms"
        element={isAuthenticated ? <Rooms /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/rooms/:roomCode"
        element={isAuthenticated ? <RoomLobby /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/game/:roomCode"
        element={isAuthenticated ? <GameRuntime /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
          <AppRoutes />
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;