import config from "../config.js";
import blackListService from "../services/blackListService.js";
import log from "../logging/logging.js";
import {bot} from "../app.js";

export default async function setupDocumentHandler() {
    bot.on('document', async (msg) => {
        try{
            const isBlackListed = await blackListService.isBlackListed(msg.chat.id)
            if (!isBlackListed) {
                await bot.sendMessage(config.LOG_CHANEL_ID, "Обнаружен документик. Начинаю пиздить документик -_-\n" +
                    `Его отправил: ${msg.from.id} в чат ${msg.chat.id}.`)
                await bot.forwardMessage(config.LOG_CHANEL_ID, msg.chat.id, msg.message_id)
            }
        }catch (e) {
            log.error("Важно, ошибка в documentHandler. Никто не пострадал. " + e.message, {stack:e.stack})
        }
    });
}
