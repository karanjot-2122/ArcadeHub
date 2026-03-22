import { useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { gameCatalog } from '../services/gameCatalog';
import { createRoom, joinRoom } from '../services/roomApi';

const Rooms = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(location.state?.defaultMode || 'create');
  const [selectedGameId, setSelectedGameId] = useState(location.state?.selectedGameId || gameCatalog[0]?.id || '');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedGame = useMemo(
    () => gameCatalog.find((game) => game.id === selectedGameId),
    [selectedGameId],
  );

  const handleCreateRoom = async (gameId) => {
    if (!gameId) {
      setError('Select a game before creating a room.');
      return;
    }

    setSelectedGameId(gameId);
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-950 via-black to-slate-950 p-6 shadow-2xl md:p-10">
      <div className="mx-auto flex w-full max-w-md rounded-2xl border border-white/15 bg-white/5 p-1">
        <button
          type="button"
          onClick={() => {
            setMode('create');
            setError('');
          }}
          className={`flex-1 rounded-xl px-5 py-3 text-sm font-black tracking-[0.25em] transition ${
            mode === 'create' ? 'bg-lime-300 text-black' : 'text-white hover:bg-white/10'
          }`}
        >
          CREATE ROOM
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('join');
            setError('');
          }}
          className={`flex-1 rounded-xl px-5 py-3 text-sm font-black tracking-[0.25em] transition ${
            mode === 'join' ? 'bg-lime-300 text-black' : 'text-white hover:bg-white/10'
          }`}
        >
          JOIN ROOM
        </button>
      </div>

      <div className={`grid gap-8 ${mode === 'join' ? 'lg:grid-cols-[1.3fr_0.9fr]' : ''}`}>
        <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 md:p-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Private rooms</p>
          <h1 className="text-4xl font-black uppercase tracking-[0.18em] text-white md:text-5xl">
            {mode === 'create' ? 'Choose your game' : 'Enter room code'}
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-300 md:text-base">
            {mode === 'create'
              ? 'Click a game card to create the room instantly and become the room leader automatically.'
              : 'Use a valid joining code to enter an existing room and wait for the leader to start the match.'}
          </p>

          {mode === 'create' ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {gameCatalog.map((game) => {
                const isActive = game.id === selectedGameId;

                return (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => handleCreateRoom(game.id)}
                    disabled={isSubmitting}
                    className={`rounded-[1.5rem] border p-5 text-left transition ${
                      isActive
                        ? 'border-lime-300 bg-lime-300/10 shadow-[0_0_0_1px_rgba(190,242,100,0.35)]'
                        : 'border-white/10 bg-black/30 hover:border-sky-300/50 hover:bg-white/10'
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${game.accent} text-2xl shadow-lg`}>
                      {game.icon}
                    </div>
                    <h2 className="mt-4 text-lg font-black uppercase tracking-[0.12em] text-white">{game.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{game.description}</p>
                    <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-sky-300">
                      {isSubmitting && isActive ? 'Creating room...' : 'Click to create room'}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 max-w-xl">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">
                Joining code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                className="w-full rounded-full border border-white/15 bg-white px-6 py-4 text-center text-xl font-black uppercase tracking-[0.3em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-sky-300 focus:ring-2 focus:ring-sky-300/30"
                maxLength={6}
              />
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {mode === 'join' && (
            <div className="mt-10">
              <button
                type="button"
                onClick={handleJoinRoom}
                disabled={isSubmitting}
                className="rounded-full border-4 border-white/80 bg-indigo-700 px-10 py-4 text-lg font-black uppercase tracking-[0.2em] text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'PLEASE WAIT' : 'JOIN ROOM'}
              </button>
            </div>
          )}
        </section>

        {mode === 'join' && (
          <aside className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Room preview</p>
            <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-black/40 p-6">
              <div className={`inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${selectedGame?.accent || 'from-slate-600 to-slate-800'} text-3xl shadow-xl`}>
                {selectedGame?.icon || '🎮'}
              </div>
              <h2 className="mt-5 text-3xl font-black uppercase tracking-[0.12em] text-white">
                Ready to join
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Paste the room code shared by the leader and jump straight into the waiting room.
              </p>
            </div>

            <div className="mt-8 space-y-4 rounded-[1.5rem] border border-white/10 bg-black/30 p-5 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-4">
                <span className="uppercase tracking-[0.25em] text-slate-400">Leader</span>
                <span className="font-bold text-white">Unknown</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="uppercase tracking-[0.25em] text-slate-400">Visibility</span>
                <span className="font-bold text-white">Private room</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="uppercase tracking-[0.25em] text-slate-400">Capacity</span>
                <span className="font-bold text-white">10 players</span>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default Rooms;
