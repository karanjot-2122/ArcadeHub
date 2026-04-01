const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // This is the library that talks to MongoDB
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const GlobalChatMessage = require('./models/GlobalChatMessage');
const { rooms, activeGames } = require('./store/index');
const AgarIO = require('./games/AgarIO');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 1. Connect to MongoDB Atlas
const uri = process.env.MONGO_URI;
mongoose.connect(uri)
  .then(() => console.log('🚀 Successfully connected to MongoDB Atlas!'))
  .catch(err => console.error('❌ Database connection error:', err));

app.get('/', (req, res) => {
  res.send('ArcadeHub Server is online and connected to the Database!');
});

// Routes
const authRoutes = require('./routes/auth');
const friendsRoutes = require('./routes/friends');
const roomsRoutes = require('./routes/rooms');

app.use('/api/auth', authRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/rooms', roomsRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const onlineUsers = new Map(); // userId => Set(socketId)
const MAX_GLOBAL_MESSAGES = 50;

const serializeGlobalMessage = (doc) => ({
  user: doc.user,
  text: doc.text,
  time: doc.createdAt.toISOString(),
});

const getLatestGlobalMessages = async () => {
  const docs = await GlobalChatMessage.find({})
    .sort({ createdAt: -1 })
    .limit(MAX_GLOBAL_MESSAGES)
    .lean();

  return docs.reverse().map((doc) => ({
    user: doc.user,
    text: doc.text,
    time: new Date(doc.createdAt).toISOString(),
  }));
};

const trimGlobalMessages = async () => {
  const overflowDocs = await GlobalChatMessage.find({})
    .sort({ createdAt: -1 })
    .skip(MAX_GLOBAL_MESSAGES)
    .select('_id')
    .lean();

  if (!overflowDocs.length) return;

  await GlobalChatMessage.deleteMany({
    _id: { $in: overflowDocs.map((doc) => doc._id) },
  });
};

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next(new Error('Authentication error'));

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error('Auth user not found'));

    socket.user = user;
    next();
  } catch (err) {
    console.error('Socket auth failed', err);
    next(new Error('Authentication error'));
  }
});

const emitFriendStatus = async (userId, isOnline) => {
  const user = await User.findById(userId).populate('friends', 'username');
  if (!user) return;

  for (const friend of user.friends) {
    const friendSockets = onlineUsers.get(friend._id.toString());
    if (friendSockets) {
      for (const socketId of friendSockets) {
        io.to(socketId).emit('friend-status', { userId, isOnline });
      }
    }
  }
};

io.on('connection', async (socket) => {
  const user = socket.user;
  if (!user) return;

  const userId = user._id.toString();
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socket.id);

  await User.findByIdAndUpdate(userId, { isOnline: true });
  await emitFriendStatus(userId, true);

  const emitFriendsOnlineSnapshot = async () => {
    const freshUser = await User.findById(userId).populate('friends', '_id');
    if (!freshUser) return;

    const onlineFriendIds = freshUser.friends
      .map((friend) => friend._id.toString())
      .filter((friendId) => {
        const sockets = onlineUsers.get(friendId);
        return sockets && sockets.size > 0;
      });

    socket.emit('friends-online-snapshot', { onlineFriendIds });
  };

  await emitFriendsOnlineSnapshot();

  // send persisted global chat history to newly connected user
  try {
    const history = await getLatestGlobalMessages();
    socket.emit('global-history', history);
  } catch (err) {
    console.error('Failed to load global chat history:', err);
    socket.emit('global-history', []);
  }

  socket.on('global-message', async (payload) => {
    const text = String(payload?.text || '').trim();
    if (!text) return;

    try {
      const saved = await GlobalChatMessage.create({
        user: user.username,
        text,
      });

      await trimGlobalMessages();

      io.emit('global-message', serializeGlobalMessage(saved));
    } catch (err) {
      console.error('Failed to persist global message:', err);
    }
  });

  socket.on('request-friends-online-snapshot', async () => {
    await emitFriendsOnlineSnapshot();
  });

  // ── Game events ──────────────────────────────────────────────────────────

  socket.on('join-game-room', ({ roomCode }) => {
    const code = String(roomCode || '').trim().toUpperCase();
    const socketRoom = `game:${code}`;
    socket.join(socketRoom);

    let game = activeGames.get(code);

    if (!game) {
      const room = rooms.get(code);
      if (!room) {
        socket.emit('game-error', { message: 'Room not found on server. Recreate the room.' });
        return;
      }

      // Only agar-io is implemented
      if (room.gameId !== 'agar-io') {
        socket.emit('game-error', { message: 'Only AGAR.IO is currently playable.' });
        return;
      }

      game = new AgarIO(code, room.players);
      activeGames.set(code, game);
      game.start((state) => {
        io.to(socketRoom).emit('game-state', state);
      });
      console.log(`[game] Started Agar.IO for room ${code}`);
    }

    // Push an immediate snapshot so new clients never stay in a loading state
    const currentState = game.tick();
    socket.emit('game-state', currentState);
  });

  socket.on('player-input', ({ roomCode, dx, dy }) => {
    const code = String(roomCode || '').trim().toUpperCase();
    const game = activeGames.get(code);
    if (game) {
      game.updateInput(userId, Number(dx) || 0, Number(dy) || 0);
    }
  });

  socket.on('leave-game-room', ({ roomCode }) => {
    const code = String(roomCode || '').trim().toUpperCase();
    socket.leave(`game:${code}`);
  });

  socket.on('disconnect', async () => {
    const set = onlineUsers.get(userId);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) {
        onlineUsers.delete(userId);
        await User.findByIdAndUpdate(userId, { isOnline: false });
        await emitFriendStatus(userId, false);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});