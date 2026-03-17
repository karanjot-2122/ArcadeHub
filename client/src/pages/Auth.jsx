import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

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
      const res = await axios.post('http://localhost:5000/api/auth/login', loginData);
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
      await axios.post('http://localhost:5000/api/auth/register', registerData);
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
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-slate-900 via-gray-900 to-black p-4">
      <div className="w-full max-w-xl bg-gray-900 rounded-2xl shadow-2xl border border-gray-800">
        <div className="flex justify-center bg-gray-850 rounded-t-2xl border-b border-gray-700">
          <button onClick={() => { setMode('login'); setError(''); setRegisterStep(1); }} className={loginTabClass}>
            Login
          </button>
          <button onClick={() => { setMode('register'); setError(''); setRegisterStep(1); }} className={signupTabClass}>
            Sign Up
          </button>
        </div>

        <div className="p-8">
          <h2 className={`text-3xl font-bold mb-5 text-center ${mode === 'login' ? 'text-indigo-400' : 'text-emerald-400'}`}>
            {mode === 'login' ? 'Welcome Back' : 'Create your account'}
          </h2>

          {error && <p className="mb-4 text-center text-red-300 font-medium">{error}</p>}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                value={loginData.email}
                placeholder="Email"
                className="w-full p-3 bg-gray-800 rounded border border-gray-700 focus:border-indigo-500 outline-none"
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              />
              <input
                type="password"
                value={loginData.password}
                placeholder="Password"
                className="w-full p-3 bg-gray-800 rounded border border-gray-700 focus:border-indigo-500 outline-none"
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              />
              <button
                type="submit"
                className={`w-full p-3 rounded font-bold ${shake ? 'shake bg-red-500' : 'bg-indigo-600 hover:bg-indigo-700'} transition duration-300`}
              >
                Login
              </button>
            </form>
          ) : (
            <form onSubmit={registerStep === 1 ? handleRegisterNext : handleRegisterSubmit} className="space-y-4">
              {registerStep === 1 ? (
                <>
                  <input
                    type="text"
                    value={registerData.username}
                    placeholder="Name"
                    className="w-full p-3 bg-gray-800 rounded border border-gray-700 focus:border-emerald-500 outline-none"
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  />
                  <input
                    type="email"
                    value={registerData.email}
                    placeholder="Email"
                    className="w-full p-3 bg-gray-800 rounded border border-gray-700 focus:border-emerald-500 outline-none"
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  />
                </>
              ) : (
                <input
                  type="password"
                  value={registerData.password}
                  placeholder="Password"
                  className="w-full p-3 bg-gray-800 rounded border border-gray-700 focus:border-emerald-500 outline-none"
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                />
              )}

              {registerStep === 2 && (
                <div className="text-sm text-slate-300">Almost there! Enter your password and hit Sign Up.</div>
              )}

              <button
                type="submit"
                className={`w-full p-3 rounded font-bold ${shake ? 'shake bg-red-500' : 'bg-emerald-600 hover:bg-emerald-700'} transition duration-300`}
              >
                {registerStep === 1 ? 'Next' : 'Sign Up'}
              </button>

              {registerStep === 2 && (
                <button
                  type="button"
                  onClick={() => setRegisterStep(1)}
                  className="w-full p-2 text-center text-sm text-slate-300 hover:text-white"
                >
                  Back
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
