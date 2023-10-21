import log from "../../logging/logging.js";
import {bot} from "../../app.js";
import i18next from "i18next"
import userService from "../../services/userService.js";
import {criticalErrorController} from "../../exceptions/bot/criticalErrorController.js";

const errorCatch = async (e, msg) => {
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В newScheduleCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack})
    await criticalErrorController(msg)
}

function getInlineKeyboard(user_language) {
    return {
        inline_keyboard: [[{text: `🤓 ${i18next.t('student', {lng:user_language})}`, callback_data: "faculty|0"}], [{
            text: `👩‍🏫 ${i18next.t("teacher", {lng:user_language})}`,
            callback_data: "department|0"
        }], [{text: " ", callback_data: "nothing"}, {text: "❌", callback_data: "delete"}, {
            text: " ",
            callback_data: "nothing"
        }]]
    }
}

function getMsgText(user_language) {
        return `👋 ${i18next.t("new_schedule_menu_content", {lng:user_language})}\n` +
            `<i>${i18next.t("new_schedule_menu_hint", {lng:user_language})}</i>\n` +
    `${i18next.t("new_schedule_menu_hint2", {lng:user_language})}`
}



export async function newScheduleCommandController(msg) {
    try {
        const user_language = await userService.getUserLanguage(msg.chat.id)
        await bot.sendMessage(msg.chat.id, getMsgText(user_language), {reply_markup: getInlineKeyboard(user_language), parse_mode: "HTML"})
    } catch (e) {
        await errorCatch(e, msg)
    }
}

export async function redirectToNewScheduleMenu(msgToEdit) {
    try {
        const user_language = await userService.getUserLanguage(msgToEdit.chat.id)
        await bot.editMessageText(getMsgText(user_language), {
            message_id: msgToEdit.message_id,
            chat_id: msgToEdit.chat.id,
            reply_markup: getInlineKeyboard(user_language),
            parse_mode: "HTML"
        })
    } catch (e) {
        await errorCatch(e, msgToEdit)
    }
}