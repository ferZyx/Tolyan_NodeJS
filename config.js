import 'dotenv/config'

const config = {
    DEBUG: process.env.DEBUG === "true",
    DB_URI: process.env.DB_URI,
    TG_TOKEN: process.env.TG_TOKEN,
    LOG_CHANEL_ID: process.env.LOG_CHANEL_ID,
    LOGGER_TG_TOKEN:process.env.LOGGER_TG_TOKEN,
    BOT_ID:process.env.BOT_ID,
    KSU_HELPER_URL:process.env.KSU_HELPER_URL,
    // Bot mode: 'polling' or 'webhook'
    BOT_MODE: process.env.BOT_MODE || 'polling',
    // Webhook settings (optional, only needed for webhook mode)
    WEBHOOK_DOMAIN: process.env.WEBHOOK_DOMAIN,
    WEBHOOK_PATH: process.env.WEBHOOK_PATH || '/bot/webhook',
    WEBHOOK_PORT: process.env.WEBHOOK_PORT || '5001',
}

// Validate required variables
const requiredVars = ['DB_URI', 'TG_TOKEN', 'LOG_CHANEL_ID', 'LOGGER_TG_TOKEN', 'BOT_ID', 'KSU_HELPER_URL'];
requiredVars.forEach((key) => {
    if (config[key] === undefined) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
});

// Validate webhook-specific variables if webhook mode is enabled
if (config.BOT_MODE === 'webhook') {
    if (!config.WEBHOOK_DOMAIN) {
        throw new Error('WEBHOOK_DOMAIN is required when BOT_MODE=webhook');
    }
}

export default config