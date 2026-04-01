const express = require('express');
const auth = require('../middleware/auth');
const { rooms, activeGames } = require('../store/index');
const AgarIO = require('../games/AgarIO');

const router = express.Router();

const ROOM_CAPACITY = 10;
const TIC_TAC_TOE_CAPACITY = 2;
const GAME_MAP = {
  'agar-io': 'AGAR.IO',
  'tic-tac-toe': 'TIC TAC TOE',
  bingo: 'BINGO',
  sumo: 'SUMO',
  'infinite-climber': 'INFINITE CLIMBER',
  'bullet-hell': 'BULLET HELL',
};

const getRoomCapacity = (gameId) => (gameId === 'tic-tac-toe' ? TIC_TAC_TOE_CAPACITY : ROOM_CAPACITY);

const generateRoomCode = () => {
  let code = '';

  do {
    code = Math.random().toString(36).slice(2, 8).toUpperCase();
  } while (rooms.has(code));

  return code;
};

const serializeRoom = (room) => ({
  code: room.code,
  gameId: room.gameId,
  gameName: room.gameName,
  leaderId: room.leaderId,
  leaderName: room.leaderName,
  players: room.players,
  maxPlayers: room.maxPlayers,
  status: room.status,
  createdAt: room.createdAt,
});

router.post('/', auth, (req, res) => {
  const { gameId } = req.body;
  const gameName = GAME_MAP[gameId];

  if (!gameName) {
    return res.status(400).json({ message: 'Select a valid game to create a room.' });
  }

  const code = generateRoomCode();
  const leader = {
    id: req.user._id.toString(),
    username: req.user.username,
    email: req.user.email,
  };

  const room = {
    code,
    gameId,
    gameName,
    leaderId: leader.id,
    leaderName: leader.username,
    players: [leader],
    maxPlayers: getRoomCapacity(gameId),
    status: 'waiting',
    createdAt: new Date().toISOString(),
  };

  rooms.set(code, room);
  res.status(201).json({ room: serializeRoom(room) });
});

router.post('/join', auth, (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ message: 'Room not found.' });
  }

  if (room.status === 'starting') {
    return res.status(400).json({ message: 'This room has already started.' });
  }

  const currentUserId = req.user._id.toString();
  const alreadyJoined = room.players.find((player) => player.id === currentUserId);

  if (!alreadyJoined && room.players.length >= room.maxPlayers) {
    return res.status(400).json({ message: 'Room is already full.' });
  }

  if (!alreadyJoined) {
    room.players.push({
      id: currentUserId,
      username: req.user.username,
      email: req.user.email,
    });
  }

  res.json({ room: serializeRoom(room) });
});

router.get('/:code', auth, (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ message: 'Room not found.' });
  }

  res.json({ room: serializeRoom(room) });
});

router.post('/:code/start', auth, (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ message: 'Room not found.' });
  }

  if (room.leaderId !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only the room leader can start the match.' });
  }

  room.status = 'starting';
  res.json({ room: serializeRoom(room) });
});

router.post('/:code/game/bootstrap', auth, (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ message: 'Room not found.' });
  }

  if (room.gameId !== 'agar-io') {
    return res.status(400).json({ message: 'Only AGAR.IO is currently playable.' });
  }

  let game = activeGames.get(code);
  if (!game) {
    game = new AgarIO(code, room.players);
    activeGames.set(code, game);
    game.start(() => {});
  }

  return res.json({ state: game.getState() });
});

router.get('/:code/game/state', auth, (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const game = activeGames.get(code);

  if (!game) {
    return res.status(404).json({ message: 'Game has not started yet.' });
  }

  return res.json({ state: game.getState() });
});

router.post('/:code/game/input', auth, (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const game = activeGames.get(code);

  if (!game) {
    return res.status(404).json({ message: 'Game has not started yet.' });
  }

  const { dx = 0, dy = 0 } = req.body || {};
  game.updateInput(req.user._id.toString(), Number(dx) || 0, Number(dy) || 0);

  return res.json({ ok: true });
});

module.exports = router;
