import "dotenv/config";
import "winston-mongodb"
import winston from "winston"
import {MongoClient} from "mongodb";
import CustomTransport from "./customTransport.js";
import config from "../config.js";


const log = winston.createLogger({
    level: 'silly',
    format: winston.format.combine(
        winston.format.printf(({level, message, stack}) => {
            return `${level}: ${message}\n${stack || ''}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        // Другие транспорты, если есть
    ],
});

const url = process.env.DB_URI;

const client = new MongoClient(url);
await client.connect();

const transportOptions = {
    db: await Promise.resolve(client),
    collection: 'logs',
    format: winston.format.metadata(),
    level:"silly"
};

if (!config.DEBUG) {
    log.add(new winston.transports.MongoDB(transportOptions)); // mongodb logging
    log.add(new CustomTransport({level: "warn"}))  // telegram warning notifications
}

export default log
