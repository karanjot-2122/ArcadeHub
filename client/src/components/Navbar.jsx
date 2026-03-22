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
    <nav className="relative flex justify-between items-center p-4 bg-gray-900 border-b border-gray-800 text-white shadow-xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition"
          aria-label="Open menu"
        >
          <span className="block w-5 h-0.5 bg-white mb-1"></span>
          <span className="block w-5 h-0.5 bg-white mb-1"></span>
          <span className="block w-5 h-0.5 bg-white"></span>
        </button>
        <Link
          to={isAuthenticated ? '/quickplay' : '/'}
          className="text-2xl font-bold tracking-widest text-blue-500 hover:text-blue-400 transition"
        >
          ARCADE<span className="text-white">HUB</span>
        </Link>
      </div>

      {isAuthenticated && (
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Signed in</p>
            <p className="text-sm font-bold text-white">{user?.username || 'Player'}</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white font-bold hover:bg-blue-400 transition"
            aria-label="Go to Profile"
          >
            {profileInitial}
          </button>
        </div>
      )}

      {menuOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 rounded-md bg-gray-800 border border-gray-700 shadow-xl z-20">
          <div className="flex flex-col p-2 gap-1">
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate('/global-chat');
              }}
              className="text-left px-3 py-2 hover:bg-gray-700 rounded transition"
            >
              GLOBAL CHAT
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate('/friends');
              }}
              className="text-left px-3 py-2 hover:bg-gray-700 rounded transition"
            >
              Friends
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate('/rooms');
              }}
              className="text-left px-3 py-2 hover:bg-gray-700 rounded transition"
            >
              Create / Join ROOMS
            </button>
            <button
              onClick={handleLogout}
              className="text-left px-3 py-2 text-red-300 hover:bg-gray-700 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;