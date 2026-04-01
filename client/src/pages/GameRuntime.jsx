import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { getRoom } from '../services/roomApi';
import AgarIOGame from './AgarIOGame';
import TicTacToeGame from './TicTacToeGame';
import BingoGame from './BingoGame';

const GameRuntime = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getRoom(token, roomCode);
        setRoom(response.room);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load game room.');
      }
    };

    load();
  }, [token, roomCode]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-400/30 bg-red-500/10 p-8 text-center text-red-100">
        <p className="text-2xl font-black uppercase tracking-[0.14em]">Game unavailable</p>
        <p className="mt-3 text-sm">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/rooms')}
          className="mt-6 rounded-full border border-white/20 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white"
        >
          Back to rooms
        </button>
      </div>
    );
  }

  if (!room) {
    return <div className="text-center text-slate-300">Loading game...</div>;
  }

  if (room.gameId === 'agar-io') return <AgarIOGame />;
  if (room.gameId === 'tic-tac-toe') return <TicTacToeGame />;
  if (room.gameId === 'bingo') return <BingoGame />;

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-8 text-center text-yellow-100">
      <p className="text-2xl font-black uppercase tracking-[0.14em]">Game not supported yet</p>
      <p className="mt-3 text-sm">{room.gameName} currently has no runtime.</p>
      <button
        type="button"
        onClick={() => navigate('/rooms')}
        className="mt-6 rounded-full border border-white/20 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white"
      >
        Back to rooms
      </button>
    </div>
  );
};

export default GameRuntime;
