import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Register from './pages/Register';

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-blue-500/30">
      <Navbar />
      <div className="container mx-auto px-4">
        <Routes>
          <Route path="/" element={
            <div className="text-center mt-32">
              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-4">
                ARCADEHUB
              </h1>
              <p className="text-gray-400 text-xl">The ultimate destination for retro gaming competitive play.</p>
            </div>
          } />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<div className="text-center mt-20 text-2xl">Login Page coming next!</div>} />
        </Routes>
      </div>
    </div>
  );
}

export default App;