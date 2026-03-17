import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const QuickPlay = () => {
  const { isAuthenticated } = useContext(AuthContext);

  const games = [
    { id: 'random', name: '🎲 RANDOM', description: 'Join a random available game, selected automatically', className: 'bg-purple-600 hover:bg-purple-500' },
    { id: 'agar-io', name: 'AGAR.IO', description: 'Grow by eating smaller cells', className: 'bg-blue-600 hover:bg-blue-500' },
    { id: 'particle-war', name: 'PARTICLE WAR', description: 'Battle in a particle arena', className: 'bg-fuchsia-600 hover:bg-fuchsia-500' },
    { id: 'tron-bikes', name: 'TRON BIKES', description: 'Lightcycle grid duels', className: 'bg-cyan-600 hover:bg-cyan-500' },
    { id: 'sumo', name: 'SUMO', description: 'Push opponents out of the ring', className: 'bg-orange-600 hover:bg-orange-500' },
    { id: 'infinite-climber', name: 'INFINITE CLIMBER', description: 'Climb as high as you can', className: 'bg-emerald-600 hover:bg-emerald-500' },
    { id: 'bullet-hell', name: 'BULLET HELL', description: 'Dodge bullets in intense combat', className: 'bg-red-600 hover:bg-red-500' },
    { id: 'tic-tac-toe', name: 'TIC TAC TOE', description: 'Classic strategic 3x3 showdown', className: 'bg-indigo-600 hover:bg-indigo-500' },
  ];

  return (
    <div className="max-w-4xl mx-auto bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl">
      <h1 className="text-4xl font-bold text-blue-400 mb-4">Quick Play Home</h1>
      <p className="text-gray-300 mb-4">
        {isAuthenticated
          ? 'You are logged in. Use this screen to select a game and jump into matches quickly.'
          : 'Please login to continue.'}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => {
              if (!isAuthenticated) return;
              if (game.id === 'random') {
                alert('Searching for a random match...');
              } else {
                alert(`Opening ${game.name}`);
              }
            }}
            className={`p-5 rounded-lg text-left text-white font-semibold transition ${game.className}`}
          >
            <h2 className="text-xl mb-1">{game.name}</h2>
            <p className="text-gray-100/90 text-sm">{game.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickPlay;