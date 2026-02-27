import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      login(res.data.token); // Save the token in context/localStorage
      alert("Login Successful!");
      navigate('/'); // Go back to the home page
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 p-8 rounded-xl shadow-2xl border border-green-900">
      <h2 className="text-3xl font-bold mb-6 text-center text-green-400">Welcome Back</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="email" placeholder="Email" 
          className="w-full p-3 bg-gray-800 rounded border border-gray-700 focus:border-green-500 outline-none"
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
        <input 
          type="password" placeholder="Password" 
          className="w-full p-3 bg-gray-800 rounded border border-gray-700 focus:border-green-500 outline-none"
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
        <button className="w-full bg-green-600 hover:bg-green-700 p-3 rounded font-bold transition">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;