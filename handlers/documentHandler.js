import config from "../config.js";
import blackListService from "../services/blackListService.js";

export default async function setupDocumentHandler(bot) {
    bot.on('document', async (msg) => {
        const isBlackListed = await blackListService.isBlackListed(msg.chat.id)
        if (!isBlackListed) {
            await bot.sendMessage(config.LOG_CHANEL_ID, "Обнаружен документик. Начинаю пиздить документик -_-\n" +
                `Его отправил: ${msg.from.id} в чат ${msg.chat.id}.`)
            await bot.forwardMessage(config.LOG_CHANEL_ID, msg.chat.id, msg.message_id)
        }
    });
}
