import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const profileInitial = user?.username?.charAt(0)?.toUpperCase() || 'P';

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className="relative flex justify-between items-center bg-gradient-to-r from-sky-400 via-sky-350 to-sky-400 px-6 py-4 text-black shadow-2xl border-b-4 border-sky-300">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="p-2 rounded-md bg-black/20 hover:bg-black/40 transition"
          aria-label="Open menu"
        >
          <span className="block w-5 h-0.5 bg-black mb-1"></span>
          <span className="block w-5 h-0.5 bg-black mb-1"></span>
          <span className="block w-5 h-0.5 bg-black"></span>
        </button>
        <Link
          to={isAuthenticated ? '/quickplay' : '/'}
          className="text-4xl font-black tracking-[0.3em] text-black drop-shadow-lg hover:drop-shadow-2xl transition"
        >
          ARCADE<span className="text-sky-600">HUB</span>
        </Link>
      </div>

      {isAuthenticated && (
        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-xs uppercase tracking-[0.25em] text-black/70 font-bold">Signed in</p>
            <p className="text-sm font-black text-black drop-shadow-sm">{user?.username || 'Player'}</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-black text-lg hover:shadow-lg hover:from-orange-300 transition-all shadow-md"
            aria-label="Go to Profile"
          >
            {profileInitial}
          </button>
        </div>
      )}

      {menuOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 rounded-xl bg-gradient-to-b from-gray-950 to-black border-2 border-lime-300/40 shadow-2xl z-20">
          <div className="flex flex-col p-2 gap-1">
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate('/global-chat');
              }}
              className="text-left px-4 py-3 hover:bg-lime-300/20 rounded-lg transition text-white font-semibold hover:text-lime-300"
            >
              💬 GLOBAL CHAT
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate('/friends');
              }}
              className="text-left px-4 py-3 hover:bg-lime-300/20 rounded-lg transition text-white font-semibold hover:text-lime-300"
            >
              👥 FRIENDS
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate('/rooms');
              }}
              className="text-left px-4 py-3 hover:bg-lime-300/20 rounded-lg transition text-white font-semibold hover:text-lime-300"
            >
              🎮 CREATE / JOIN ROOMS
            </button>
            <div className="border-t border-white/10 my-2"></div>
            <button
              onClick={handleLogout}
              className="text-left px-4 py-3 text-red-300 hover:bg-red-600/30 rounded-lg transition font-semibold hover:text-red-100 w-full"
            >
              🚪 LOGOUT
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;