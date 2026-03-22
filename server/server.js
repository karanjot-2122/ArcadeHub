const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // This is the library that talks to MongoDB
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
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
const globalChatHistory = [];
const MAX_GLOBAL_MESSAGES = 50;

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

  // send existing global chat history to newly connected user
  socket.emit('global-history', globalChatHistory);

  socket.on('global-message', (payload) => {
    const now = new Date();
    const message = {
      user: payload.user || user.username,
      text: payload.text || '',
      time: now.toISOString(),
    };

    // add to history ring buffer
    globalChatHistory.push(message);
    if (globalChatHistory.length > MAX_GLOBAL_MESSAGES) {
      globalChatHistory.shift();
    }

    io.emit('global-message', message);
  });

  socket.on('request-friends-online-snapshot', async () => {
    await emitFriendsOnlineSnapshot();
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