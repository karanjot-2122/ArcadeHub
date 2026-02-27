import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Login from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="container mx-auto mt-10 p-4">
          <Routes>
            <Route path="/" element={<h1 className="text-4xl text-center font-bold text-blue-400">Welcome to ArcadeHub</h1>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;