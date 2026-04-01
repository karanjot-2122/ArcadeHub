// Shared in-memory store accessible by both routes and socket handlers
const rooms = new Map(); // roomCode => room object
const activeGames = new Map(); // roomCode => AgarIO game instance

module.exports = { rooms, activeGames };
