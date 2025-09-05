import 'dotenv/config'

const config = {
    DEBUG: process.env.DEBUG === "true",
    DB_URI: process.env.DB_URI,
    TG_TOKEN: process.env.TG_TOKEN,
    LOG_CHANEL_ID: process.env.LOG_CHANEL_ID,
    LOGGER_TG_TOKEN:process.env.LOGGER_TG_TOKEN,
    BOT_ID:process.env.BOT_ID,
    KSU_HELPER_URL:process.env.KSU_HELPER_URL,
}

Object.keys(config).forEach((key) => {
    if (config[key] === undefined) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
})

export default config