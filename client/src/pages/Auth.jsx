import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Auth = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '' });
  const [registerStep, setRegisterStep] = useState(1);

  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setShake(false);
    setRegisterStep(1);
  }, [initialMode]);

  const triggerError = (message) => {
    setError(message);
    setShake(true);
    setTimeout(() => setShake(false), 420);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      triggerError('Please enter both email and password.');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, loginData);
      auth.login(res.data.token, res.data.user);
      setError('');
      navigate('/quickplay');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed: Email or password invalid';
      triggerError(msg);
    }
  };

  const handleRegisterNext = (e) => {
    e.preventDefault();
    if (!registerData.username || !registerData.email) {
      triggerError('Username and email are required to continue.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      triggerError('Please enter a valid email address.');
      return;
    }
    setError('');
    setRegisterStep(2);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerData.password) {
      triggerError('Password is required.');
      return;
    }
    if (registerData.password.length < 6) {
      triggerError('Password must be at least 6 characters.');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/auth/register`, registerData);
      setError('Registration successful! Please login.');
      setMode('login');
      setRegisterStep(1);
      setLoginData({ email: registerData.email, password: '' });
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Try different details.';
      triggerError(msg);
    }
  };

  const tabCommon = 'px-6 py-3 rounded-t-lg font-semibold transition-all ease-out duration-250';
  const loginTabClass = mode === 'login'
    ? `${tabCommon} bg-indigo-500 text-white shadow-lg` : `${tabCommon} bg-gray-700 text-gray-300 hover:bg-gray-600`;
  const signupTabClass = mode === 'register'
    ? `${tabCommon} bg-emerald-500 text-white shadow-lg` : `${tabCommon} bg-gray-700 text-gray-300 hover:bg-gray-600`;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-950 via-black to-slate-900 p-4">
      <div className="w-full max-w-xl bg-gradient-to-b from-gray-950 to-black rounded-3xl shadow-2xl border-2 border-lime-300/30">
        <div className="flex justify-center bg-gradient-to-r from-indigo-700 to-blue-700 rounded-t-2xl border-b-4 border-lime-300 p-1 gap-1">
          <button onClick={() => { setMode('login'); setError(''); setRegisterStep(1); }} className={`flex-1 px-6 py-3.5 rounded-lg font-black text-sm tracking-wider transition-all ${mode === 'login' ? 'bg-lime-300 text-black shadow-lg shadow-lime-300/50' : 'bg-black/40 text-white hover:bg-black/60'}`}>
            LOGIN
          </button>
          <button onClick={() => { setMode('register'); setError(''); setRegisterStep(1); }} className={`flex-1 px-6 py-3.5 rounded-lg font-black text-sm tracking-wider transition-all ${mode === 'register' ? 'bg-lime-300 text-black shadow-lg shadow-lime-300/50' : 'bg-black/40 text-white hover:bg-black/60'}`}>
            SIGN UP
          </button>
        </div>

        <div className="p-10">
          <h2 className={`text-4xl font-black mb-6 text-center tracking-wider drop-shadow-lg ${mode === 'login' ? 'bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-lime-300 to-green-300 bg-clip-text text-transparent'}`}>
            {mode === 'login' ? 'WELCOME BACK' : 'JOIN THE ARCADE'}
          </h2>

          {error && <div className="mb-4 text-center rounded-xl bg-red-600/20 border border-red-400/50 px-4 py-3 text-red-200 font-bold text-sm">{error}</div>}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                value={loginData.email}
                placeholder="EMAIL"
                className="w-full px-4 py-3 bg-gray-900 rounded-lg border-2 border-gray-700 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/30 outline-none text-white placeholder:text-gray-500 font-semibold transition-all"
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              />
              <input
                type="password"
                value={loginData.password}
                placeholder="PASSWORD"
                className="w-full px-4 py-3 bg-gray-900 rounded-lg border-2 border-gray-700 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/30 outline-none text-white placeholder:text-gray-500 font-semibold transition-all"
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              />
              <button
                type="submit"
                className={`w-full py-3 rounded-lg font-black text-lg tracking-wider transition-all ${shake ? 'shake bg-red-600 text-white' : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg'}`}
              >
                LOGIN
              </button>
            </form>
          ) : (
            <form onSubmit={registerStep === 1 ? handleRegisterNext : handleRegisterSubmit} className="space-y-4">
              {registerStep === 1 ? (
                <>
                  <input
                    type="text"
                    value={registerData.username}
                    placeholder="USERNAME"
                    className="w-full px-4 py-3 bg-gray-900 rounded-lg border-2 border-gray-700 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/30 outline-none text-white placeholder:text-gray-500 font-semibold transition-all"
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  />
                  <input
                    type="email"
                    value={registerData.email}
                    placeholder="EMAIL"
                    className="w-full px-4 py-3 bg-gray-900 rounded-lg border-2 border-gray-700 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/30 outline-none text-white placeholder:text-gray-500 font-semibold transition-all"
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  />
                </>
              ) : (
                <input
                  type="password"
                  value={registerData.password}
                  placeholder="PASSWORD"
                  className="w-full px-4 py-3 bg-gray-900 rounded-lg border-2 border-gray-700 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/30 outline-none text-white placeholder:text-gray-500 font-semibold transition-all"
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                />
              )}

              {registerStep === 2 && (
                <div className="text-sm text-lime-300 font-semibold bg-lime-300/10 rounded-lg p-3 border border-lime-300/30">✨ Almost there! Now enter your password and hit SIGN UP.</div>
              )}

              <button
                type="submit"
                className={`w-full py-3 rounded-lg font-black text-lg tracking-wider transition-all ${shake ? 'shake bg-red-600 text-white' : 'bg-gradient-to-r from-lime-400 to-green-400 hover:from-lime-300 hover:to-green-300 text-black shadow-lg'}`}
              >
                {registerStep === 1 ? 'NEXT' : 'SIGN UP'}
              </button>

              {registerStep === 2 && (
                <button
                  type="button"
                  onClick={() => setRegisterStep(1)}
                  className="w-full p-2 text-center text-sm text-white/70 hover:text-white font-semibold"
                >
                  ← BACK
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
