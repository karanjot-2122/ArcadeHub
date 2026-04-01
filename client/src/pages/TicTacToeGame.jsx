import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { bootstrapGame, getGameState, sendGameMove } from '../services/roomApi';

const TicTacToeGame = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { token, user, logout } = useContext(AuthContext);

  const [state, setState] = useState(null);
  const [error, setError] = useState('');

  const refreshState = useCallback(async () => {
    try {
      const response = state ? await getGameState(token, roomCode) : await bootstrapGame(token, roomCode);
      setState(response.state);
      setError('');
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setError(err.response?.data?.message || 'Unable to load Tic Tac Toe state.');
    }
  }, [state, token, roomCode, logout, navigate]);

  useEffect(() => {
    refreshState();
    const id = setInterval(refreshState, 700);
    return () => clearInterval(id);
  }, [refreshState]);

  const myPlayerIndex = state?.players?.findIndex((p) => p.id === user?.id) ?? -1;
  const myMark = myPlayerIndex === 0 ? 'X' : myPlayerIndex === 1 ? 'O' : '-';
  const isMyTurn = state?.currentTurn === user?.id;
  const winnerName = state?.winnerId ? state.players.find((p) => p.id === state.winnerId)?.username : null;

  const handleMove = async (index) => {
    if (!state || state.winnerId || state.isDraw || !isMyTurn) return;
    if (state.board[index] !== null) return;

    try {
      const response = await sendGameMove(token, roomCode, { index });
      setState(response.state);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid move.');
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-950 via-black to-slate-950 p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Game</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.15em] text-white">Tic Tac Toe</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/rooms')}
          className="rounded-full border border-white/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-white/10"
        >
          Leave
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-300">
        <p>Room: <span className="font-bold text-lime-300 uppercase">{roomCode}</span></p>
        <p className="mt-1">You are: <span className="font-bold text-white">{myMark}</span></p>
        {state?.winnerId ? (
          <p className="mt-1 font-bold text-lime-300">Winner: {winnerName}</p>
        ) : state?.isDraw ? (
          <p className="mt-1 font-bold text-amber-300">Draw game</p>
        ) : (
          <p className="mt-1">Turn: <span className="font-bold text-white">{state?.players?.find((p) => p.id === state?.currentTurn)?.username || '—'}</span></p>
        )}
      </div>

      {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>}

      <div className="mx-auto grid w-full max-w-md grid-cols-3 gap-3">
        {(state?.board || Array(9).fill(null)).map((cell, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleMove(index)}
            className="aspect-square rounded-2xl border border-white/20 bg-black/40 text-4xl font-black text-white transition hover:bg-white/10 disabled:opacity-70"
            disabled={Boolean(cell) || !isMyTurn || Boolean(state?.winnerId) || Boolean(state?.isDraw)}
          >
            {cell || ''}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TicTacToeGame;
