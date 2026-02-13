module.exports = {
  apps: [
    {
      name: 'admin-panel',
      cwd: '/var/www/carphacom/current/admin-panel',
      script: '/www/server/nvm/versions/node/v24.13.0/bin/npm',
      args: 'start',
      interpreter: '/www/server/nvm/versions/node/v24.13.0/bin/node',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        PATH: '/www/server/nvm/versions/node/v24.13.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/var/www/carphacom/logs/admin-panel-error.log',
      out_file: '/var/www/carphacom/logs/admin-panel-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
