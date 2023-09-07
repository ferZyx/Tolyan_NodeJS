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
                format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
                format.printf(({level, message, stack, timestamp}) => {
                    return `${timestamp} || ${level.toUpperCase()} || ${message}\n${stack || ''}`;
                }),
            ),
        }),

        new transports.File({
            filename: "logs.log",
            level: 'silly',
            format: format.combine(format.timestamp(), format.json())
        }),
        new transports.File({
            filename: "error_logs.log",
            level: 'error',
            format: format.combine(format.timestamp(), format.json())
        }),
    ],
});

if (!config.DEBUG) {
    log.add(new CustomTransport({
        level: "warn"
    }))  // telegram warning notifications
}

export default log
