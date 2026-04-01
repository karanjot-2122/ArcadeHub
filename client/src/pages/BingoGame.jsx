import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { bootstrapGame, getGameState, sendGameMove, getRoom } from '../services/roomApi';

const BingoGame = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { token, user, logout } = useContext(AuthContext);

  const [state, setState] = useState(null);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');

  const refreshState = useCallback(async () => {
    try {
      const [roomRes, gameRes] = await Promise.all([
        room ? Promise.resolve({ room }) : getRoom(token, roomCode),
        state ? getGameState(token, roomCode) : bootstrapGame(token, roomCode),
      ]);

      if (!room) setRoom(roomRes.room);
      setState(gameRes.state);
      setError('');
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setError(err.response?.data?.message || 'Unable to load Bingo state.');
    }
  }, [state, room, token, roomCode, logout, navigate]);

  useEffect(() => {
    refreshState();
    const id = setInterval(refreshState, 900);
    return () => clearInterval(id);
  }, [refreshState]);

  const isLeader = room?.leaderId === user?.id;
  const winnerName = state?.winnerId ? state.players.find((p) => p.id === state.winnerId)?.username : null;

  const drawNumber = async () => {
    try {
      const response = await sendGameMove(token, roomCode, { action: 'draw' });
      setState(response.state);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to draw number.');
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-950 via-black to-slate-950 p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Game</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.15em] text-white">Bingo</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/rooms')}
          className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-white/10"
        >
          Leave
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:col-span-2">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Your card</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {(state?.myCard || []).map((n, i) => {
              const marked = (state?.myMarkedIndices || []).includes(i);
              return (
                <div
                  key={`${n}-${i}`}
                  className={`flex aspect-square items-center justify-center rounded-lg border text-sm font-black ${marked ? 'border-lime-300 bg-lime-300/20 text-lime-200' : 'border-white/10 bg-black/40 text-white'}`}
                >
                  {i === 12 ? 'FREE' : n}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Current number</p>
          <p className="mt-3 text-5xl font-black text-lime-300">{state?.currentNumber || '—'}</p>
          <p className="mt-4 text-xs text-slate-400">Drawn: {(state?.numbersDrawn || []).length}/75</p>
          {winnerName && <p className="mt-2 text-sm font-bold text-lime-300">Winner: {winnerName}</p>}

          <button
            type="button"
            onClick={drawNumber}
            disabled={!isLeader || Boolean(state?.winnerId)}
            className="mt-6 w-full rounded-full bg-sky-400 px-5 py-3 text-sm font-black uppercase tracking-[0.15em] text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
          >
            Draw Number
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>}
    </div>
  );
};

export default BingoGame;
