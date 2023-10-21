import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import {bot} from "../../app.js";
import userService from "../../services/userService.js";
import groupService from "../../services/groupService.js";
import log from "../../logging/logging.js";
import ScheduleController from "../ScheduleController.js";
import i18next from "i18next";
import {criticalErrorController} from "../../exceptions/bot/criticalErrorController.js";

const errorCatch = async (e, msg) => {
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В groupScheduleCommandController. Юзеру сказано что бот прибоел.` + e.message, {
        stack: e.stack,
        userId: msg.chat.id
    })
    await criticalErrorController(msg)
}

export async function sendUserGroupSchedule(User, msg, answer) {
    const user_language = await userService.getUserLanguage(msg.chat.id)
    const groupId = User.group

    const Group = await groupService.getById(groupId)
    if (!Group) {
        log.error(`!!! USER ${msg.chat.id} УЧИТСЯ В ГРУППЕ КОТОРОЙ НЕТ В БД. group: ${groupId}. `, {
            User,
            userId: msg.chat.id
        })
        const msg_text = i18next.t('group_not_found', {lng:user_language})
        return bot.editMessageText(msg_text, {
            chat_id: answer.chat.id, message_id: answer.message_id
        })
    }
    const language = Group.language
    const day = ScheduleController.getCurrentDayNumber()

    const call = {
        data: `schedule|${language}|${groupId}|${day}`,
        message: answer
    }
    await ScheduleController.chooseScheduleLanguage(call)
}

export async function groupScheduleCommandController(msg) {
    await commandAntiSpamMiddleware(msg, async () => {
        const user_language = await userService.getUserLanguage(msg.chat.id)
        const answer = await bot.sendMessage(msg.chat.id, `🪄 ${i18next.t('schedule_loading', { lng: user_language })}`, {parse_mode: 'HTML'})
        try {
            const User = await userService.getUserById(msg.chat.id)

            if (!User) {
                await bot.deleteMessage(msg.chat.id, answer.message_id);
                const msg_text = i18next.t('who_are_you', {lng:user_language})
                return await bot.sendMessage(msg.chat.id, msg_text)
            }
            if (!User.group) {
                return await ScheduleController.getFacultyMenu(answer, 0)
            }

            await sendUserGroupSchedule(User, msg, answer)
        } catch (e) {
            await errorCatch(e, msg)
        }
    })
}