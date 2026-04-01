const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;
const TICK_RATE = 50; // ms between server ticks (20fps)
const MAX_FOOD = 200;
const INITIAL_MASS = 10;

const PLAYER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9',
];

const FOOD_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFC300', '#2ECC71',
  '#1ABC9C', '#3498DB', '#9B59B6', '#E91E63',
];

class AgarIO {
  constructor(roomCode, players) {
    this.roomCode = roomCode;
    this.players = new Map();
    this.food = new Map();
    this.foodIdCounter = 0;
    this.gameLoop = null;
    this.lastState = null;

    // Initialise each player
    players.forEach((player, index) => {
      this._addPlayer(player.id, player.username, index);
    });

    // Seed food
    for (let i = 0; i < MAX_FOOD; i++) {
      this._spawnFood();
    }

    this.lastState = this._buildState();
  }

  // ─── helpers ────────────────────────────────────────────────────────────────

  _addPlayer(userId, username, colorIndex = 0) {
    this.players.set(userId, {
      id: userId,
      username,
      x: Math.random() * (WORLD_WIDTH - 200) + 100,
      y: Math.random() * (WORLD_HEIGHT - 200) + 100,
      mass: INITIAL_MASS,
      color: PLAYER_COLORS[colorIndex % PLAYER_COLORS.length],
      dx: 0,
      dy: 0,
      alive: true,
    });
  }

  _spawnFood() {
    const id = `f${this.foodIdCounter++}`;
    this.food.set(id, {
      id,
      x: Math.random() * (WORLD_WIDTH - 100) + 50,
      y: Math.random() * (WORLD_HEIGHT - 100) + 50,
      mass: 1,
      color: FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)],
    });
  }

  _radius(mass) {
    return Math.sqrt(mass) * 6;
  }

  // ─── public API ─────────────────────────────────────────────────────────────

  updateInput(userId, dx, dy) {
    const p = this.players.get(userId);
    if (p && p.alive) {
      p.dx = dx;
      p.dy = dy;
    }
  }

  tick() {
    const dt = TICK_RATE / 1000; // seconds

    // 1. Move players
    for (const p of this.players.values()) {
      if (!p.alive) continue;

      const len = Math.sqrt(p.dx * p.dx + p.dy * p.dy);
      if (len > 0) {
        const speed = 150 / Math.sqrt(p.mass); // bigger = slower
        p.x += (p.dx / len) * speed * dt;
        p.y += (p.dy / len) * speed * dt;
      }

      // Clamp inside world
      const r = this._radius(p.mass);
      p.x = Math.max(r, Math.min(WORLD_WIDTH - r, p.x));
      p.y = Math.max(r, Math.min(WORLD_HEIGHT - r, p.y));
    }

    // 2. Player vs food
    for (const p of this.players.values()) {
      if (!p.alive) continue;
      const pr = this._radius(p.mass);

      for (const [fid, food] of this.food.entries()) {
        if (Math.hypot(p.x - food.x, p.y - food.y) < pr) {
          p.mass += food.mass;
          this.food.delete(fid);
          this._spawnFood();
        }
      }
    }

    // 3. Player vs player
    const alive = [...this.players.values()].filter(p => p.alive);
    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i];
        const b = alive[j];
        if (!a.alive || !b.alive) continue;

        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const ra = this._radius(a.mass);
        const rb = this._radius(b.mass);
        const overlap = Math.max(ra, rb) * 0.85;

        if (dist < overlap) {
          if (a.mass > b.mass * 1.1) {
            a.mass += b.mass;
            b.alive = false;
          } else if (b.mass > a.mass * 1.1) {
            b.mass += a.mass;
            a.alive = false;
          }
        }
      }
    }

    this.lastState = this._buildState();
    return this.lastState;
  }

  getState() {
    if (!this.lastState) {
      this.lastState = this._buildState();
    }

    return this.lastState;
  }

  _buildState() {
    return {
      worldWidth: WORLD_WIDTH,
      worldHeight: WORLD_HEIGHT,
      players: [...this.players.values()].map(p => ({
        id: p.id,
        username: p.username,
        x: p.x,
        y: p.y,
        mass: p.mass,
        radius: this._radius(p.mass),
        color: p.color,
        alive: p.alive,
      })),
      food: [...this.food.values()].map(f => ({
        id: f.id,
        x: f.x,
        y: f.y,
        radius: 6,
        color: f.color,
      })),
    };
  }

  start(onTick) {
    this.gameLoop = setInterval(() => {
      onTick(this.tick());
    }, TICK_RATE);
  }

  stop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }
}

module.exports = AgarIO;
