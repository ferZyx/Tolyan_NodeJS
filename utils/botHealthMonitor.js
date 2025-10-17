import log from "../logging/logging.js";
import db from "../db/connection.js";

class BotHealthMonitor {
    constructor() {
        this.lastBotActivity = Date.now();
        this.startTime = Date.now();
    }

    // Update last activity timestamp (call this on every bot update)
    updateActivity() {
        this.lastBotActivity = Date.now();
    }

    // Get time since last activity in seconds
    getTimeSinceLastActivity() {
        return Math.floor((Date.now() - this.lastBotActivity) / 1000);
    }

    // Get uptime in seconds
    getUptime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    // Check if bot is healthy
    async isHealthy() {
        const checks = {
            bot: false,
            database: false,
            uptime: this.getUptime(),
            timeSinceLastActivity: this.getTimeSinceLastActivity(),
        };

        // Check 1: Bot activity (no activity for more than 5 minutes is suspicious)
        const timeSinceActivity = this.getTimeSinceLastActivity();
        if (timeSinceActivity < 300) { // 5 minutes
            checks.bot = true;
        } else {
            log.warn(`Bot health check: No activity for ${timeSinceActivity} seconds`);
        }

        // Check 2: Database connection
        try {
            if (db.connection && db.connection.readyState === 1) {
                checks.database = true;
            } else {
                log.warn('Bot health check: Database not connected');
            }
        } catch (e) {
            log.error('Bot health check: Error checking database', { stack: e.stack });
        }

        return {
            healthy: checks.bot && checks.database,
            checks,
            timestamp: new Date().toISOString(),
        };
    }

    // Get health status as object
    async getStatus() {
        return this.isHealthy();
    }
}

export default new BotHealthMonitor();
