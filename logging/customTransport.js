import Transport from 'winston-transport';
import https from "https";
import config from "../config.js";

import path from "path"; // in Browser, the URL in native accessible on window

import { URL } from 'url';
const __dirname = new URL('.', import.meta.url).pathname;


class CustomTransport extends Transport {
    constructor(options) {
        super(options);
    }

    log(info, callback) {
        const BASE_DIR = path.basename(path.dirname(__dirname))

        const log_chanel_id = config.LOG_CHANEL_ID;

        const text = `[${BASE_DIR}][${info.level}]%20` + info.message.replace(" ", "%20");

        const token = config.TG_TOKEN
        const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${log_chanel_id}&text=${text}`

        https.get(url)

        callback();
    }
}

export default CustomTransport