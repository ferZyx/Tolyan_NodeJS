import winston from "winston";
import * as https from "https";

import { URL } from 'url';
import * as path from "path"; // in Browser, the URL in native accessible on window

const __filename = new URL('', import.meta.url).pathname;
// Will contain trailing slash
const __dirname = new URL('.', import.meta.url).pathname;


// Кастомная функция для обработки логов
function myCustomLoggingFunction(level, msg, meta) {
    const BASE_DIR = path.basename(path.dirname(__dirname))

    const log_chanel_id = -1001787183783;

    const text = `[${BASE_DIR}][${level}]%20` + msg.replace(" ", "%20");

    const token = "5769986080:AAFrxkWntMGmQnpwMOkivZbg4eNMq2FqQJg"
    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${log_chanel_id}&text=${text}`

    https.get(url)
}

class CustomTransport extends winston.Transport {
    constructor(options) {
        super(options);
        this.name = 'custom';
        this.level = options.level || 'info'; // Уровень логов для этого транспорта (по умолчанию 'info')
    }

    log(level, msg, meta, callback) {
        const levels = winston.config.npm.levels;
        if (levels[level] <= levels[this.level]) {
            // Если уровень лога больше или равен уровню этого транспорта
            // Вызываем нашу кастомную функцию для обработки логов
            myCustomLoggingFunction(level, msg, meta);
        }
        callback();
    }
}


export default CustomTransport