import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { gameCatalog } from '../services/gameCatalog';
import './QuickPlay.css';

// Icon components for each game
const GameIcons = {
  random: () => (
    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-lime-400 to-lime-500 rounded-full shadow-lg group-hover:shadow-[0_0_25px_rgba(205,220,57,0.6)]">
      <span className="text-2xl">🎲</span>
    </div>
  ),
  'agar-io': () => (
    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full shadow-lg group-hover:shadow-[0_0_25px_rgba(205,220,57,0.6)]">
      <span className="text-2xl">🌍</span>
    </div>
  ),
  'particle-war': () => (
    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-fuchsia-400 to-pink-400 rounded-full shadow-lg group-hover:shadow-[0_0_25px_rgba(205,220,57,0.6)]">
      <span className="text-2xl">⚛️</span>
    </div>
  ),
  'tron-bikes': () => (
    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-cyan-400 to-sky-400 rounded-full shadow-lg group-hover:shadow-[0_0_25px_rgba(205,220,57,0.6)]">
      <span className="text-2xl">🏍️</span>
    </div>
  ),
  'sumo': () => (
    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full shadow-lg group-hover:shadow-[0_0_25px_rgba(205,220,57,0.6)]">
      <span className="text-2xl">🥋</span>
    </div>
  ),
  'infinite-climber': () => (
    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-lime-400 to-green-400 rounded-full shadow-lg group-hover:shadow-[0_0_25px_rgba(205,220,57,0.6)]">
      <span className="text-2xl">🧗</span>
    </div>
  ),
  'bullet-hell': () => (
    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-red-400 to-rose-400 rounded-full shadow-lg group-hover:shadow-[0_0_25px_rgba(205,220,57,0.6)]">
      <span className="text-2xl">💥</span>
    </div>
  ),
  'tic-tac-toe': () => (
    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-indigo-400 to-violet-400 rounded-full shadow-lg group-hover:shadow-[0_0_25px_rgba(205,220,57,0.6)]">
      <span className="text-2xl">❌</span>
    </div>
  ),
  bingo: () => (
    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-pink-400 to-fuchsia-400 rounded-full shadow-lg group-hover:shadow-[0_0_25px_rgba(205,220,57,0.6)]">
      <span className="text-2xl">🎱</span>
    </div>
  ),
};

const QuickPlay = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const games = [
    {
      id: 'random',
      name: 'QUICK MATCH',
      description: 'Join a random available game instantly',
      icon: 'random',
      isRandom: true,
    },
    ...gameCatalog.map((game) => ({
      id: game.id,
      name: game.name,
      description: game.description,
      icon: game.id,
      isRandom: false,
    })),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Header Section */}
        <div className="mb-12 text-center md:text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-1 w-12 bg-gradient-to-r from-lime-400 to-lime-500 rounded-full"></div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-lime-400 drop-shadow-lg">⚡ Launch Zone</p>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-[0.15em] text-white drop-shadow-[0_0_20px_rgba(205,220,57,0.3)] mb-4">
            Quick Play
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-lime-400 to-lime-500 rounded-full md:block hidden mb-4"></div>
          <p className="text-sm md:text-base text-gray-300 max-w-2xl leading-relaxed">
            {isAuthenticated ? (
              <>
                <span className="text-lime-400 font-bold">🎮 READY TO GAME?</span> Select your battlefield or let fate choose for you. Jump into intense multiplayer action instantly!
              </>
            ) : (
              <>
                <span className="text-lime-400 font-bold">🔐 LOGIN REQUIRED</span> Sign in to access all games and create private rooms with friends.
              </>
            )}
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game) => {
            const IconComponent = GameIcons[game.icon];
            return (
              <button
                key={game.id}
                onClick={() => {
                  if (!isAuthenticated) return;
                  if (game.isRandom) {
                    alert('🎲 Searching for a random match...');
                  } else {
                    navigate('/rooms', {
                      state: {
                        defaultMode: 'create',
                        selectedGameId: game.id,
                      },
                    });
                  }
                }}
                disabled={!isAuthenticated}
                className={`game-card group relative h-full overflow-hidden rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  !isAuthenticated ? 'card-disabled' : ''
                }`}
              >
                {/* Background with lime and black gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-black border-2 border-lime-500/30 group-hover:border-lime-400/60 transition-colors duration-300 rounded-2xl"></div>

                {/* Animated background glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl bg-gradient-to-br from-lime-500/10 via-transparent to-transparent"></div>

                {/* Content */}
                <div className="relative z-10 p-6 md:p-8 h-full flex flex-col items-center justify-between">
                  {/* Icon */}
                  <div className="transition-transform duration-300 group-hover:scale-110">
                    <div className="icon-badge">
                      {IconComponent()}
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="w-full">
                    <h2 className="text-lg md:text-xl font-black uppercase tracking-wider text-white mb-2 group-hover:text-lime-300 transition-colors duration-300">
                      {game.name}
                    </h2>
                    <p className="text-xs md:text-sm text-gray-300 leading-tight group-hover:text-gray-200 transition-colors duration-300">
                      {game.description}
                    </p>
                  </div>

                  {/* Play Badge */}
                  <div className="mt-4 w-full">
                    <div className="px-3 py-2 bg-gradient-to-r from-lime-500 to-lime-400 text-black font-bold text-xs uppercase tracking-wider rounded-lg group-hover:shadow-[0_0_15px_rgba(205,220,57,0.5)] transition-shadow duration-300">
                      ▶ Play Now
                    </div>
                  </div>
                </div>

                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-lime-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            );
          })}
        </div>

        {/* Bottom accent */}
        <div className="mt-12 flex items-center justify-center gap-4">
          <div className="h-1 flex-1 bg-gradient-to-r from-transparent to-lime-500 rounded-full"></div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400 drop-shadow-lg">⚡ ARCADE HUB ⚡</p>
          <div className="h-1 flex-1 bg-gradient-to-l from-transparent to-lime-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default QuickPlay;