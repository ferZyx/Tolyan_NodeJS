import 'dotenv/config'

const config = {
    DEBUG: Boolean(process.env.DEBUG) || false,
    DB_URI: process.env.DB_URI,
    TG_TOKEN: process.env.TG_TOKEN,
}

export default config