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
const BINGO_NUMBER_MAX = 75;

const pickRandom = (array) => array[Math.floor(Math.random() * array.length)];

const createTicTacToeGame = (room) => ({
  type: 'tic-tac-toe',
  players: room.players.slice(0, 2).map((p) => ({ id: p.id, username: p.username })),
  board: Array(9).fill(null),
  currentTurn: room.players[0]?.id || null,
  winnerId: null,
  isDraw: false,
});

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const createBingoCard = () => {
  const nums = Array.from({ length: BINGO_NUMBER_MAX }, (_, i) => i + 1);
  const card = [];
  while (card.length < 25) {
    const n = pickRandom(nums);
    if (!card.includes(n)) card.push(n);
  }
  return card;
};

const createBingoGame = (room) => {
  const cardsByUser = {};
  const markedByUser = {};
  for (const p of room.players) {
    cardsByUser[p.id] = createBingoCard();
    markedByUser[p.id] = [12]; // free center tile
  }

  return {
    type: 'bingo',
    leaderId: room.leaderId,
    players: room.players.map((p) => ({ id: p.id, username: p.username })),
    cardsByUser,
    markedByUser,
    numbersDrawn: [],
    currentNumber: null,
    winnerId: null,
  };
};

const hasBingo = (markedIndices) => {
  const marked = new Set(markedIndices);
  const lines = [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20],
  ];

  return lines.some((line) => line.every((idx) => marked.has(idx)));
};

const getGameStateForUser = (room, game, userId) => {
  if (!game) return null;

  if (room.gameId === 'agar-io') {
    return game.getState();
  }

  if (room.gameId === 'tic-tac-toe') {
    return {
      type: game.type,
      players: game.players,
      board: game.board,
      currentTurn: game.currentTurn,
      winnerId: game.winnerId,
      isDraw: game.isDraw,
    };
  }

  if (room.gameId === 'bingo') {
    return {
      type: game.type,
      players: game.players,
      currentNumber: game.currentNumber,
      numbersDrawn: game.numbersDrawn,
      winnerId: game.winnerId,
      myCard: game.cardsByUser[userId] || [],
      myMarkedIndices: game.markedByUser[userId] || [],
    };
  }

  return null;
};

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

  if (room.gameId === 'tic-tac-toe' && room.players.length !== TIC_TAC_TOE_CAPACITY) {
    return res.status(400).json({ message: 'Tic Tac Toe requires exactly 2 players.' });
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

  if (room.status !== 'starting') {
    return res.status(400).json({ message: 'Game has not been started by the room leader yet.' });
  }

  const currentUserId = req.user._id.toString();
  const inRoom = room.players.some((p) => p.id === currentUserId);
  if (!inRoom) {
    return res.status(403).json({ message: 'You are not a member of this room.' });
  }

  let game = activeGames.get(code);
  if (!game) {
    if (room.gameId === 'agar-io') {
      game = new AgarIO(code, room.players);
      game.start(() => {});
    } else if (room.gameId === 'tic-tac-toe') {
      game = createTicTacToeGame(room);
    } else if (room.gameId === 'bingo') {
      game = createBingoGame(room);
    } else {
      return res.status(400).json({ message: `${room.gameName} is not playable yet.` });
    }

    activeGames.set(code, game);
  }

  return res.json({ state: getGameStateForUser(room, game, currentUserId) });
});

router.get('/:code/game/state', auth, (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const room = rooms.get(code);
  const game = activeGames.get(code);

  if (!room) {
    return res.status(404).json({ message: 'Room not found.' });
  }

  if (!game) {
    return res.status(404).json({ message: 'Game has not started yet.' });
  }

  return res.json({ state: getGameStateForUser(room, game, req.user._id.toString()) });
});

router.post('/:code/game/input', auth, (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const room = rooms.get(code);
  const game = activeGames.get(code);

  if (!room) {
    return res.status(404).json({ message: 'Room not found.' });
  }

  if (room.gameId !== 'agar-io') {
    return res.status(400).json({ message: 'Input endpoint is only for AGAR.IO.' });
  }

  if (!game) {
    return res.status(404).json({ message: 'Game has not started yet.' });
  }

  const { dx = 0, dy = 0 } = req.body || {};
  game.updateInput(req.user._id.toString(), Number(dx) || 0, Number(dy) || 0);

  return res.json({ ok: true });
});

router.post('/:code/game/move', auth, (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const room = rooms.get(code);
  const game = activeGames.get(code);
  const currentUserId = req.user._id.toString();

  if (!room) {
    return res.status(404).json({ message: 'Room not found.' });
  }

  if (!game) {
    return res.status(404).json({ message: 'Game has not started yet.' });
  }

  if (room.gameId === 'tic-tac-toe') {
    const { index } = req.body || {};
    if (typeof index !== 'number' || index < 0 || index > 8) {
      return res.status(400).json({ message: 'Invalid move index.' });
    }

    if (game.winnerId || game.isDraw) {
      return res.status(400).json({ message: 'This game is already finished.' });
    }

    if (game.currentTurn !== currentUserId) {
      return res.status(400).json({ message: 'It is not your turn.' });
    }

    if (game.board[index] !== null) {
      return res.status(400).json({ message: 'Cell already occupied.' });
    }

    const meIndex = game.players.findIndex((p) => p.id === currentUserId);
    if (meIndex === -1) {
      return res.status(403).json({ message: 'You are not part of this game.' });
    }

    const mark = meIndex === 0 ? 'X' : 'O';
    game.board[index] = mark;

    const hasWon = winningLines.some((line) => line.every((i) => game.board[i] === mark));
    if (hasWon) {
      game.winnerId = currentUserId;
    } else if (game.board.every((cell) => cell !== null)) {
      game.isDraw = true;
    } else {
      const other = game.players.find((p) => p.id !== currentUserId);
      game.currentTurn = other?.id || null;
    }

    return res.json({ state: getGameStateForUser(room, game, currentUserId) });
  }

  if (room.gameId === 'bingo') {
    const { action } = req.body || {};
    if (action !== 'draw') {
      return res.status(400).json({ message: 'Only draw action is supported.' });
    }

    if (currentUserId !== room.leaderId) {
      return res.status(403).json({ message: 'Only room leader can draw numbers.' });
    }

    if (game.winnerId) {
      return res.status(400).json({ message: 'Bingo already has a winner.' });
    }

    if (game.numbersDrawn.length >= BINGO_NUMBER_MAX) {
      return res.status(400).json({ message: 'All numbers are already drawn.' });
    }

    const available = [];
    for (let n = 1; n <= BINGO_NUMBER_MAX; n++) {
      if (!game.numbersDrawn.includes(n)) available.push(n);
    }

    const drawn = pickRandom(available);
    game.currentNumber = drawn;
    game.numbersDrawn.push(drawn);

    for (const p of game.players) {
      const card = game.cardsByUser[p.id] || [];
      const idx = card.indexOf(drawn);
      if (idx >= 0) {
        const marks = new Set(game.markedByUser[p.id] || []);
        marks.add(idx);
        game.markedByUser[p.id] = [...marks];

        if (!game.winnerId && hasBingo(game.markedByUser[p.id])) {
          game.winnerId = p.id;
        }
      }
    }

    return res.json({ state: getGameStateForUser(room, game, currentUserId) });
  }

  return res.status(400).json({ message: `${room.gameName} does not support moves yet.` });
});

module.exports = router;
