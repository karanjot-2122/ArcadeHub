import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Profile = () => {
  const { user, token, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });
    } catch (err) {
      console.error('Logout API failed', err);
    } finally {
      logout();
      window.location.href = '/login';
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-[2rem] border-2 border-lime-300/40 bg-gradient-to-b from-gray-950 to-black p-8 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-lime-300 mb-2">User info</p>
        <h1 className="text-4xl font-black uppercase tracking-wider text-white mb-6 drop-shadow-lg">Profile</h1>
        
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-gradient-to-r from-orange-600/20 to-orange-700/20 border border-orange-400/30">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
            {user?.username?.charAt(0)?.toUpperCase() || 'P'}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-bold">Username</p>
            <p className="text-lg font-black text-white">{user?.username || 'Guest'}</p>
            <p className="text-xs text-gray-400 mt-1">{user?.email || 'No email'}</p>
          </div>
        </div>

        <div className="space-y-3 mb-6 p-4 rounded-xl bg-black/50 border border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">Status</span>
            <span className="px-3 py-1 rounded-full bg-lime-300/20 border border-lime-300/40 text-lime-300 text-xs font-bold uppercase">🟢 Online</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">Member since</span>
            <span className="text-white font-bold">22/3/2026</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl text-white font-black uppercase tracking-wider shadow-lg transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;