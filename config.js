import 'dotenv/config'

const config = {
    DEBUG: process.env.DEBUG === "true",
    DB_URI: process.env.DB_URI,
    TG_TOKEN: process.env.TG_TOKEN,
    LOG_CHANEL_ID: process.env.LOG_CHANEL_ID
}

export default config