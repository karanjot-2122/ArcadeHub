import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { gameCatalog } from '../services/gameCatalog';

const QuickPlay = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const games = [
    { id: 'random', name: '🎲 RANDOM', description: 'Join a random available game, selected automatically', className: 'bg-purple-600 hover:bg-purple-500' },
    ...gameCatalog.map((game) => ({
      id: game.id,
      name: game.name,
      description: game.description,
      className: 'bg-sky-700 hover:bg-sky-600',
    })),
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
                navigate('/rooms', {
                  state: {
                    defaultMode: 'create',
                    selectedGameId: game.id,
                  },
                });
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