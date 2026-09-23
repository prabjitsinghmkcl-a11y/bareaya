module.exports = {
  apps: [
    {
      name: 'bareaya-api',
      cwd: './backend',
      script: 'index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      exp_backoff_restart_delay: 1000,
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        FRONTEND_URL: 'https://bareya.in'
      }
    }
  ]
};