import "dotenv/config";
import "winston-mongodb"
import {createLogger, transports, format} from "winston"
import CustomTransport from "./customTransport.js";
import config from "../config.js";


const log = createLogger({
    transports: [
        new transports.Console({
            level: 'silly',
            format: format.combine(
                format.printf(({level, message, stack}) => {
                    return `${level}: ${message}\n${stack || ''}`;
                })
            ),
        }),

        new transports.File({
            filename: "logs.log",
            level: 'silly',
            format: format.combine(format.timestamp(), format.json())
        }),
    ],
});

if (!config.DEBUG) {
    log.add(new transports.MongoDB({
        db: process.env.DB_URI,
        collection: 'logs',
        options: {useUnifiedTopology: true},
        format: format.metadata(),
        level: "silly"
    })); // mongodb logging
    log.add(new CustomTransport({
        level: "warn"
    }))  // telegram warning notifications
}

export default log
