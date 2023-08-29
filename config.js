import 'dotenv/config'

const config = {
    DEBUG: process.env.DEBUG,
    DB_URI: process.env.DB_URI,
    TG_TOKEN: process.env.TG_TOKEN,
}

console.log(config)

export default config