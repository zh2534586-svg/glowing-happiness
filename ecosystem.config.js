module.exports = {
  apps: [{
    name: 'aimusic-api',
    script: './backend/dist/index.js',
    cwd: '/var/www/aimusic',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DATABASE_URL: 'file:/var/www/aimusic/backend/prisma/dev.db',
      JWT_SECRET: 'FAf8OxjX4xGP2zNcRflpvd+IupwUN0dgOiiqUoB6eTmH4U7V1fequ882e1W0MIiZ',
      CORS_ORIGIN: 'https://www.yin.com',
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
  }],
};
