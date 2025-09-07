import log from "../../logging/logging.js";
import config from "../../config.js";
import {bot} from "../../app.js";
import userService from "../../services/userService.js";
import i18next from "i18next";
import {criticalErrorController} from "../../exceptions/bot/criticalErrorController.js";

const errorCatch = async (e, msg) => {
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В donateCommandController. Юзеру сказано что бот прибоел.` + e.message, {
        stack: e.stack,
        userId: msg.chat.id
    })
    await criticalErrorController(msg)
}

export async function donateCommandController(msg) {
    try {
        const user_language = await userService.getUserLanguage(msg.chat.id)

        log.warn(`User ${msg.chat.id} прописал /donate`, {userId: msg.chat.id})

        const msg_text = i18next.t('donate_command_content', {lng:user_language, card_number: "4400430340634796"})

        await bot.sendMessage(msg.chat.id, msg_text, {parse_mode: 'HTML'})
        await bot.forwardMessage(config.LOG_CHANEL_ID, msg.chat.id, msg.message_id)
    } catch (e) {
        await errorCatch(e, msg)
    }
}