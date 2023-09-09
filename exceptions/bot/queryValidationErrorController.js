import log from "../../logging/logging.js";

export async function queryValidationErrorController(bot, call) {
    try {
        log.error(`User ${call.message.chat.id} used an incorrect callback: ${call.data}. Данные об ошибке в метаданных. Ему сказано шоб /start писал!`, {
            call
        })
        await bot.editMessageText("⚠️ Произошла ошибка!\n" +
            "Либо вы использовали старые кнопочки, либо я сломался.\n" +
            "Попробуйте прописать /start и пройти авторизацию повторно.\n" +
            "Если это не помогает - свяжитесь с нами через https://t.me/lena_nebot", {
            chat_id: call.message.chat.id, message_id: call.message.message_id, disable_web_page_preview: true
        })
    } catch (e) {
        log.error("УЛЬТРА МЕГА ВАЖНО! ОШИБКА ПРИ ПОПЫТКЕ ОБРАБОТАТЬ ОШИБКУ! queryValidationErrorController." + e.message,
            {call, stack: e.stack})
    }
}