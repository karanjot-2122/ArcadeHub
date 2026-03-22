export const gameCatalog = [
  {
    id: 'agar-io',
    name: 'AGAR.IO',
    description: 'Grow by absorbing smaller cells and outmaneuver the room.',
    icon: '🎲',
    accent: 'from-emerald-400 via-cyan-400 to-blue-500',
  },
  {
    id: 'particle-war',
    name: 'PARTICLE WAR',
    description: 'Fast arena battles with high-speed particle combat.',
    icon: '⚛️',
    accent: 'from-fuchsia-400 via-pink-500 to-rose-500',
  },
  {
    id: 'tron-bikes',
    name: 'TRON BIKES',
    description: 'Light up the grid and trap your opponents.',
    icon: '🏍️',
    accent: 'from-cyan-400 via-sky-500 to-indigo-500',
  },
  {
    id: 'sumo',
    name: 'SUMO',
    description: 'Hold the ring and knock everyone else out.',
    icon: '🥋',
    accent: 'from-orange-400 via-amber-500 to-yellow-500',
  },
  {
    id: 'infinite-climber',
    name: 'INFINITE CLIMBER',
    description: 'Scale higher and survive longer than the rest.',
    icon: '🧗',
    accent: 'from-lime-400 via-green-500 to-emerald-500',
  },
  {
    id: 'bullet-hell',
    name: 'BULLET HELL',
    description: 'Survive a dense storm of projectiles and chaos.',
    icon: '💥',
    accent: 'from-red-400 via-rose-500 to-pink-500',
  },
  {
    id: 'tic-tac-toe',
    name: 'TIC TAC TOE',
    description: 'Classic strategy with quick competitive rounds.',
    icon: '❌',
    accent: 'from-indigo-400 via-violet-500 to-purple-500',
  },
];

export const getGameById = (gameId) => gameCatalog.find((game) => game.id === gameId);
