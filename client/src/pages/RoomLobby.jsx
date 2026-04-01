import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { getGameById } from '../services/gameCatalog';
import { getRoom, startRoom } from '../services/roomApi';

const RoomLobby = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const fetchRoom = useCallback(async () => {
    if (!token || !roomCode) return;

    try {
      const response = await getRoom(token, roomCode);
      setRoom(response.room);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load room details.');
    }
  }, [roomCode, token]);

  useEffect(() => {
    fetchRoom();

    const intervalId = window.setInterval(fetchRoom, 2000);
    return () => window.clearInterval(intervalId);
  }, [fetchRoom]);

  // Auto-navigate to game when the leader starts the room
  useEffect(() => {
    if (room?.status === 'starting' && room?.gameId === 'agar-io') {
      const timer = setTimeout(() => {
        navigate(`/game/${room.code}`);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [room?.status, room?.gameId, room?.code, navigate]);

  const game = useMemo(() => getGameById(room?.gameId), [room?.gameId]);
  const isLeader = Boolean(room && user && room.leaderId === user.id);

  const handleStart = async () => {
    if (!roomCode) return;

    setIsStarting(true);
    try {
      const response = await startRoom(token, roomCode);
      setRoom(response.room);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start room.');
    } finally {
      setIsStarting(false);
    }
  };

  if (error && !room) {
    return (
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-400/30 bg-red-500/10 p-8 text-center text-red-100">
        <h1 className="text-3xl font-black uppercase tracking-[0.16em]">Room unavailable</h1>
        <p className="mt-4 text-sm text-red-100/80">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/rooms')}
          className="mt-8 rounded-full border border-white/30 px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
        >
          Back to rooms
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-950 via-black to-slate-950 p-6 shadow-2xl md:p-8">
      <div className="grid gap-4 border-b border-white/15 pb-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Room lobby</p>
          <h1 className="mt-3 text-5xl font-black uppercase tracking-[0.16em] text-white md:text-7xl">Room</h1>
        </div>
        <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-slate-200 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Leader</p>
            <p className="mt-2 text-2xl font-black text-white">{room?.leaderName || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Joining code</p>
            <p className="mt-2 text-2xl font-black uppercase tracking-[0.18em] text-lime-300">{room?.code || roomCode}</p>
          </div>
        </div>
      </div>

      {room?.status === 'starting' && (
        <div className="rounded-[1.5rem] border border-lime-300/40 bg-lime-300/10 px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-lime-200">
          Match is starting for {room?.gameName}.
        </div>
      )}

      {error && room && (
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
        <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-[0.14em] text-white">Players in room</h2>
              <p className="mt-2 text-sm text-slate-300">Everyone inside the lobby before the leader starts the match.</p>
            </div>
            <div className="text-4xl font-black text-white">
              {room?.players?.length || 0}
              <span className="text-slate-400">/{room?.maxPlayers || 10}</span>
            </div>
          </div>

          <ol className="mt-8 grid gap-4 md:grid-cols-2">
            {room?.players?.map((player, index) => (
              <li
                key={player.id}
                className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-black/30 px-5 py-4"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Player {index + 1}</p>
                  <p className="mt-2 text-xl font-bold text-white">{player.username}</p>
                </div>
                {player.id === room?.leaderId && (
                  <span className="rounded-full border border-lime-300/40 bg-lime-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-lime-200">
                    Leader
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>

        <aside className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Selected game</p>
          <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-black/40 p-6 text-center">
            <div className={`mx-auto inline-flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br ${game?.accent || 'from-slate-600 to-slate-800'} text-5xl shadow-xl`}>
              {game?.icon || '🎮'}
            </div>
            <h2 className="mt-5 text-3xl font-black uppercase tracking-[0.12em] text-white">{room?.gameName || 'Unknown game'}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{game?.description || 'Game details will appear here once a selection is available.'}</p>
          </div>

          <div className="mt-6 space-y-4 rounded-[1.5rem] border border-white/10 bg-black/30 p-5 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-4">
              <span className="uppercase tracking-[0.22em] text-slate-400">Leader</span>
              <span className="font-bold text-white">{room?.leaderName || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="uppercase tracking-[0.22em] text-slate-400">Joining code</span>
              <span className="font-bold uppercase tracking-[0.18em] text-lime-300">{room?.code || roomCode}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="uppercase tracking-[0.22em] text-slate-400">Status</span>
              <span className="font-bold text-white">{room?.status === 'starting' ? 'Starting' : 'Waiting'}</span>
            </div>
          </div>

          {isLeader ? (
            <button
              type="button"
              onClick={handleStart}
              disabled={isStarting || room?.status === 'starting'}
              className="mt-8 w-full rounded-full bg-sky-400 px-6 py-5 text-xl font-black uppercase tracking-[0.2em] text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              {room?.status === 'starting' ? 'STARTING' : isStarting ? 'PLEASE WAIT' : 'START'}
            </button>
          ) : (
            <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/30 px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
              Waiting for {room?.leaderName || 'the leader'} to start the game.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default RoomLobby;
