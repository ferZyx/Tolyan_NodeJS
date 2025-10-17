module.exports = {
    apps: [
        {
            name: "tolyan-bot",
            script: "npm",
            args: "run start",
            log_date_format: "YYYY-MM-DD HH:mm:ss",
            autorestart: true,
            max_restarts: 10,
            min_uptime: "10s",
            restart_delay: 4000,
            // Kill timeout for graceful shutdown
            kill_timeout: 5000,
            // Environment variables (optional, can be set in .env)
            env: {
                NODE_ENV: "production"
            },
            // Health check monitoring (optional - requires PM2 Plus)
            // Uncomment if you have PM2 Plus or want to use it
            // max_memory_restart: "500M",
        }
    ]
}
