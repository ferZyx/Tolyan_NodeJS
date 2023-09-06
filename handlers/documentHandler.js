import config from "../config.js";

export default function setupDocumentHandler(bot) {
    bot.on('document', async (msg) => {
        await bot.sendMessage(config.LOG_CHANEL_ID, "Обнаружен документик. Начинаю пиздить документик -_-")
        await bot.forwardMessage(config.LOG_CHANEL_ID, msg.chat.id, msg.message_id)
    });
}
