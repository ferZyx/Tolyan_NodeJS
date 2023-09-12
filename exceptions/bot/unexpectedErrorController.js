import log from "../../logging/logging.js";

export async function unexpectedErrorController(e, bot, message, callback_data) {
    try {
        if (e.response && e.response.body.description === 'Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message') {
            log.info(`User ${message.chat.id} получил ошибку о том шо сообщение нот модифайнед. Скипаю ошибочку`, {userId: message.chat.id})
        } else {
            try{
                log.error(`User ${message.chat.id} got an error at ${callback_data}. Данные об ошибке в метаданных.`, {
                    stack: e.stack, message, callback_data, userId: message.chat.id
                })
                await bot.editMessageText("⚠️ Дико извиняемся, произошла какая то ошибка." + "\n🔩 Не переживайте, я уже вызвал фиксиков! Постараемся всё починить как можно скорее!", {
                    chat_id: message.chat.id, message_id: message.message_id, reply_markup: {
                        inline_keyboard: [[{text: "Попробовать снова", callback_data}]]
                    }
                })
            }catch (e) {
                await unexpectedErrorController(e, bot, message, callback_data)
            }
        }
    } catch (e) {
        console.error(e)
        log.error("УЛЬТРА МЕГА ВАЖНО! ОШИБКА ПРИ ПОПЫТКЕ ОБРАБОТАТЬ ОШИБКУ! errorHandler",
            {userId: message.chat.id, stack:e.stack, callback_data})
    }
}