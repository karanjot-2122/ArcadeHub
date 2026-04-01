import { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { gameCatalog } from '../services/gameCatalog';
import { createRoom, joinRoom } from '../services/roomApi';

const Rooms = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(location.state?.defaultMode || 'create');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateRoom = async (gameId) => {
    if (!gameId) {
      setError('Select a game before creating a room.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const { room } = await createRoom(token, gameId);
      navigate(`/rooms/${room.code}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create room right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError('Enter a room code to join.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const normalizedCode = roomCode.trim().toUpperCase();
      const { room } = await joinRoom(token, normalizedCode);
      navigate(`/rooms/${room.code}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to join room right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-[2rem] border-2 border-lime-300/40 bg-gradient-to-b from-slate-950 via-black to-slate-950 p-6 shadow-2xl md:p-10">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.35em] text-lime-300 mb-3">Game Rooms</p>
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-[0.2em] text-white drop-shadow-lg mb-4">Private Rooms</h1>
      </div>

      <div className="mx-auto flex w-full max-w-md rounded-2xl border-2 border-lime-300/40 bg-black/50 p-1.5 gap-1.5">
        <button
          type="button"
          onClick={() => {
            setMode('create');
            setError('');
          }}
          className={`flex-1 rounded-xl px-5 py-4 text-sm font-black tracking-[0.25em] transition-all ${
            mode === 'create'
              ? 'bg-gradient-to-r from-lime-300 to-green-300 text-black shadow-lg shadow-lime-300/50'
              : 'bg-black/40 text-white hover:bg-lime-300/10'
          }`}
        >
          🎮 CREATE
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('join');
            setError('');
          }}
          className={`flex-1 rounded-xl px-5 py-4 text-sm font-black tracking-[0.25em] transition-all ${
            mode === 'join'
              ? 'bg-gradient-to-r from-lime-300 to-green-300 text-black shadow-lg shadow-lime-300/50'
              : 'bg-black/40 text-white hover:bg-lime-300/10'
          }`}
        >
          📝 JOIN
        </button>
      </div>

      <div>
        <section className="rounded-[2rem] border-2 border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur-sm">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-lime-300">Setup</p>
          <h2 className="text-4xl font-black uppercase tracking-[0.18em] text-white md:text-5xl drop-shadow-lg">
            {mode === 'create' ? '🕹️ Select Your Game' : '🔐 Enter Room Code'}
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-slate-300 md:text-base">
            {mode === 'create'
              ? '⚡ Click a game to create the room instantly and become the room leader automatically.'
              : '📍 Use a valid joining code to enter an existing room and wait for the leader to start the match.'}
          </p>

          {mode === 'create' ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {gameCatalog.map((game) => {
                return (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => handleCreateRoom(game.id)}
                    disabled={isSubmitting}
                    className={`relative group rounded-[1.75rem] border-2 p-6 text-left transition-all duration-300 overflow-hidden ${
                      isSubmitting
                        ? 'border-orange-400/50 bg-gradient-to-br from-orange-900/40 to-orange-800/40 shadow-xl shadow-orange-600/20'
                        : 'border-gray-700 bg-gradient-to-br from-gray-900/60 to-black/60 hover:border-lime-300 hover:shadow-[0_0_20px_rgba(205,220,57,0.4)]'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${game.accent} text-3xl shadow-lg mb-4`}>
                        {game.icon}
                      </div>
                      <h3 className="text-lg font-black uppercase tracking-[0.12em] text-white">{game.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{game.description}</p>
                      <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-lime-300">
                        {isSubmitting ? '⏳ Creating room...' : '✨ Click to create'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 max-w-xl">
              <label className="mb-4 block text-xs font-black uppercase tracking-[0.35em] text-lime-300">
                🔑 Enter Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="w-full rounded-full border-2 border-lime-300/30 bg-gray-900 px-6 py-5 text-center text-2xl font-black uppercase tracking-[0.4em] text-white outline-none transition placeholder:text-gray-600 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/40"
                maxLength={6}
              />
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border-2 border-red-400/50 bg-red-600/20 px-5 py-4 text-sm font-semibold text-red-200">
              ⚠️ {error}
            </div>
          )}

          {mode === 'join' && (
            <div className="mt-10">
              <button
                type="button"
                onClick={handleJoinRoom}
                disabled={isSubmitting}
                className="w-full rounded-full border-4 border-lime-300/60 bg-gradient-to-r from-indigo-700 to-blue-700 hover:from-indigo-600 hover:to-blue-600 px-10 py-5 text-lg font-black uppercase tracking-[0.25em] text-white transition-all hover:shadow-[0_0_25px_rgba(205,220,57,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? '⏳ Joining...' : '📍 Join Room'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Rooms;
