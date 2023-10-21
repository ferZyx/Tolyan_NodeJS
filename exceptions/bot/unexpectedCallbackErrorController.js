import log from "../../logging/logging.js";
import {bot} from "../../app.js";
import userService from "../../services/userService.js";
import i18next from "i18next";

export async function unexpectedCallbackErrorController(e, message, callback_data) {
    try {
        if (e.response && e.response.body.description === 'Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message') {
            log.info(`User ${message.chat.id} получил ошибку о том шо сообщение нот модифайнед. Скипаю ошибочку`, {userId: message.chat.id})
        } else {
            try {
                const user_language = await userService.getUserLanguage(message.chat.id)

                log.error(`User ${message.chat.id} got an error at ${callback_data}. Данные об ошибке в метаданных.`, {
                    stack: e.stack, message, callback_data, userId: message.chat.id
                })
                const msg_text = i18next.t('error', {lng:user_language})
                const button_text = i18next.t('try_again', {lng:user_language})
                await bot.editMessageText(msg_text, {
                    chat_id: message.chat.id, message_id: message.message_id, reply_markup: {
                        inline_keyboard: [[{text: button_text, callback_data}]]
                    }
                })
            } catch (e) {
                log.error(`ВАЖНО! user: ${message.chat.id}! Не получилось сообщить ему о том что произошла ошибка. unexpectedErrorController!` + e.message, {stack: e.stack})
            }
        }
    } catch (e) {
        console.error(e)
        log.error(`User: ${message.chat.id}! УЛЬТРА МЕГА ВАЖНО! ОШИБКА ПРИ ПОПЫТКЕ ОБРАБОТАТЬ ОШИБКУ! unexpectedErrorHandler!` + e.message,
            {stack: e.stack, callback_data})
    }
}