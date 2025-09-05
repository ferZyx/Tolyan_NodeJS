module.exports = {
    apps: [
        {
            name: "tolyan-bot",
            script: "npm",
            args: "run start",
            log_date_format: "YYYY-MM-DD HH:mm:ss",
            autorestart: true,
        }
    ]
}
