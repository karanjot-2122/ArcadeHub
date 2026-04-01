import { useEffect, useRef, useContext, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { bootstrapGame, getGameState, sendGameInput } from '../services/roomApi';

const LERP = 0.2;
const STATE_POLL_MS = 50;
const INPUT_SEND_MS = 50;

const AgarIOGame = () => {
  const { roomCode } = useParams();
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);
  const renderPlayersRef = useRef(new Map());
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastInputRef = useRef({ dx: 0, dy: 0 });
  const animFrameRef = useRef(null);
  const inputIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const pollInFlightRef = useRef(false);
  const inputInFlightRef = useRef(false);

  const [leaderboard, setLeaderboard] = useState([]);
  const [isDead, setIsDead] = useState(false);
  const [connected, setConnected] = useState(false);
  const [gameError, setGameError] = useState('');

  const drawArrow = (ctx, x, y, angle, color) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-7, -5);
    ctx.lineTo(-7, 5);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = gameStateRef.current;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, W, H);

    if (!state) {
      ctx.fillStyle = '#a3e635';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Connecting to game…', W / 2, H / 2);
      animFrameRef.current = requestAnimationFrame(render);
      return;
    }

    const myId = user?.id;
    const renderMap = renderPlayersRef.current;

    for (const player of state.players) {
      const prev = renderMap.get(player.id);
      if (!prev) {
        renderMap.set(player.id, { ...player });
        continue;
      }

      prev.x += (player.x - prev.x) * LERP;
      prev.y += (player.y - prev.y) * LERP;
      prev.mass += (player.mass - prev.mass) * LERP;
      prev.radius += (player.radius - prev.radius) * LERP;
      prev.alive = player.alive;
      prev.color = player.color;
      prev.username = player.username;
    }

    const idSet = new Set(state.players.map((p) => p.id));
    for (const id of renderMap.keys()) {
      if (!idSet.has(id)) renderMap.delete(id);
    }

    const renderedPlayers = [...renderMap.values()];
    const me = renderedPlayers.find((p) => p.id === myId);
    const camX = me ? me.x : state.worldWidth / 2;
    const camY = me ? me.y : state.worldHeight / 2;
    const zoom = me ? Math.max(0.26, Math.min(1, 1 / Math.sqrt(me.mass / 10))) : 0.6;

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);

    const gridSize = 60;
    ctx.strokeStyle = '#161616';
    ctx.lineWidth = 1;
    const vLeft = camX - W / 2 / zoom;
    const vTop = camY - H / 2 / zoom;
    const vRight = camX + W / 2 / zoom;
    const vBottom = camY + H / 2 / zoom;
    const gx0 = Math.floor(vLeft / gridSize) * gridSize;
    const gy0 = Math.floor(vTop / gridSize) * gridSize;
    for (let x = gx0; x <= vRight + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, vTop - gridSize);
      ctx.lineTo(x, vBottom + gridSize);
      ctx.stroke();
    }
    for (let y = gy0; y <= vBottom + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(vLeft - gridSize, y);
      ctx.lineTo(vRight + gridSize, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#a3e635';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, state.worldWidth, state.worldHeight);

    for (const food of state.food) {
      ctx.beginPath();
      ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
      ctx.fillStyle = food.color;
      ctx.fill();
    }

    for (const player of renderedPlayers) {
      if (!player.alive) continue;
      const isMe = player.id === myId;

      ctx.beginPath();
      ctx.arc(player.x + 4, player.y + 4, player.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fillStyle = player.color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.strokeStyle = isMe ? '#ffffff' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = isMe ? 3 : 1.5;
      ctx.stroke();

      if (player.radius > 14) {
        const fontSize = Math.max(12, Math.min(player.radius * 0.38, 28));
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.username, player.x, player.y - fontSize * 0.2);
        if (player.radius > 22) {
          ctx.font = `${fontSize * 0.65}px Arial`;
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillText(Math.round(player.mass), player.x, player.y + fontSize * 0.7);
        }
      }
    }

    ctx.restore();

    const edgePad = 36;
    for (const player of renderedPlayers) {
      if (!player.alive || player.id === myId) continue;

      const sx = (player.x - camX) * zoom + W / 2;
      const sy = (player.y - camY) * zoom + H / 2;
      const inView = sx >= edgePad && sx <= W - edgePad && sy >= edgePad && sy <= H - edgePad;
      if (inView) continue;

      const angle = Math.atan2(sy - H / 2, sx - W / 2);
      const maxRadiusX = W / 2 - edgePad;
      const maxRadiusY = H / 2 - edgePad;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const scale = Math.min(Math.abs(maxRadiusX / (cos || 0.0001)), Math.abs(maxRadiusY / (sin || 0.0001)));
      const ax = W / 2 + cos * scale;
      const ay = H / 2 + sin * scale;

      drawArrow(ctx, ax, ay, angle, player.color || '#fff');
    }

    animFrameRef.current = requestAnimationFrame(render);
  }, [user]);

  useEffect(() => {
    const canvas = canvasRef.current;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const applyState = (state) => {
      gameStateRef.current = state;
      setConnected(true);
      setGameError('');

      const sorted = [...state.players]
        .filter((p) => p.alive)
        .sort((a, b) => b.mass - a.mass)
        .slice(0, 5);
      setLeaderboard(sorted);

      const me = state.players.find((p) => p.id === user?.id);
      if (me && !me.alive) setIsDead(true);
    };

    const handleAuthFailure = () => {
      logout();
      navigate('/login', { replace: true });
    };

    const loadInitialState = async () => {
      try {
        const { state } = await bootstrapGame(token, roomCode);
        applyState(state);
      } catch (err) {
        const status = err?.response?.status;
        const message = err?.response?.data?.message || 'Unable to start game.';
        setConnected(false);
        setGameError(message);

        if (status === 401) {
          handleAuthFailure();
        }
      }
    };

    const pollState = async () => {
      if (pollInFlightRef.current) return;
      pollInFlightRef.current = true;
      try {
        const { state } = await getGameState(token, roomCode);
        applyState(state);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          handleAuthFailure();
          return;
        }

        if (status !== 404) {
          setGameError(err?.response?.data?.message || 'Unable to refresh game state.');
        }
      } finally {
        pollInFlightRef.current = false;
      }
    };

    loadInitialState();
    pollIntervalRef.current = setInterval(pollState, STATE_POLL_MS);

    const onMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouseMove);

    inputIntervalRef.current = setInterval(async () => {
      if (inputInFlightRef.current) return;
      const state = gameStateRef.current;
      if (!state) return;
      const me = state.players.find((p) => p.id === user?.id);
      if (!me || !me.alive) return;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const dx = mouseRef.current.x - cx;
      const dy = mouseRef.current.y - cy;

      const diffX = Math.abs(dx - lastInputRef.current.dx);
      const diffY = Math.abs(dy - lastInputRef.current.dy);
      if (diffX < 2 && diffY < 2) return;

      lastInputRef.current = { dx, dy };
      inputInFlightRef.current = true;
      try {
        await sendGameInput(token, roomCode, { dx, dy });
      } catch (err) {
        if (err?.response?.status === 401) {
          handleAuthFailure();
        }
      } finally {
        inputInFlightRef.current = false;
      }
    }, INPUT_SEND_MS);

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      clearInterval(inputIntervalRef.current);
      clearInterval(pollIntervalRef.current);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [token, user, roomCode, render, logout, navigate]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#080808', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      <div style={{
        position: 'absolute', top: 16, right: 16,
        background: 'rgba(0,0,0,0.75)', borderRadius: 16, padding: '12px 16px',
        minWidth: 170, backdropFilter: 'blur(6px)',
        border: '1px solid rgba(163,230,53,0.3)',
      }}>
        <p style={{ margin: 0, color: '#a3e635', fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
          🏆 Leaderboard
        </p>
        {leaderboard.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '3px 0' }}>
            <span style={{ color: p.id === user?.id ? '#a3e635' : '#fff', fontSize: 13, fontWeight: 700 }}>
              {i + 1}. {p.username}
            </span>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>{Math.round(p.mass)}</span>
          </div>
        ))}
        {leaderboard.length === 0 && <p style={{ color: '#475569', fontSize: 11, margin: 0 }}>Loading…</p>}
      </div>

      <div style={{
        position: 'absolute', top: 16, left: 16,
        background: 'rgba(0,0,0,0.75)', borderRadius: 12, padding: '8px 14px',
        border: '1px solid rgba(163,230,53,0.3)', backdropFilter: 'blur(6px)',
      }}>
        <p style={{ margin: 0, color: '#64748b', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>AGAR.IO</p>
        <p style={{ margin: 0, color: '#a3e635', fontSize: 14, fontWeight: 900, letterSpacing: '0.15em' }}>{roomCode}</p>
      </div>

      <button
        onClick={() => navigate('/rooms')}
        style={{
          position: 'absolute', top: 78, left: 16,
          background: 'rgba(0,0,0,0.78)', color: '#fff', border: '1px solid rgba(163,230,53,0.35)',
          borderRadius: 999, padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}
      >
        Leave
      </button>

      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: '0.1em',
        background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '4px 12px',
      }}>
        Move your mouse to steer · Eat food & smaller cells to grow
      </div>

      {isDead && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
        }}>
          <p style={{ color: '#ef4444', fontSize: 64, fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            You died!
          </p>
          <p style={{ color: '#94a3b8', fontSize: 16, margin: '12px 0 32px' }}>
            Better luck next time
          </p>
          <button
            onClick={() => navigate('/rooms')}
            style={{
              background: '#a3e635', color: '#000', border: 'none', borderRadius: 999,
              padding: '14px 40px', fontSize: 15, fontWeight: 900, cursor: 'pointer',
              letterSpacing: '0.15em', textTransform: 'uppercase',
            }}
          >
            Back to Rooms
          </button>
        </div>
      )}

      {!connected && (
        <div style={{
          position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)',
          color: '#a3e635', fontSize: 13, letterSpacing: '0.12em',
        }}>
          Connecting…
        </div>
      )}

      {gameError && (
        <div style={{
          position: 'absolute', bottom: 78, left: '50%', transform: 'translateX(-50%)',
          color: '#fecaca', fontSize: 12, letterSpacing: '0.06em',
          background: 'rgba(127,29,29,0.65)', border: '1px solid rgba(248,113,113,0.55)',
          borderRadius: 10, padding: '7px 12px',
        }}>
          {gameError}
        </div>
      )}
    </div>
  );
};

export default AgarIOGame;
