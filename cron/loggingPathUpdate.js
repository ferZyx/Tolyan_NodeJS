import cron from "node-cron";
import log from "../logging/logging.js";
import DailyRotateFile from "winston-daily-rotate-file"

export async function setupLoggingPathUpdate(){
    cron.schedule('0 0 * * *', () => {
        // Пересоздать транспорт для логирования
        log.transports.forEach((transport) => {
            if (transport instanceof DailyRotateFile) {
                transport.reopenFile();
            }
        });
    });
}
