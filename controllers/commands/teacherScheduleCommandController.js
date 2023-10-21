import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import log from "../../logging/logging.js";
import {bot} from "../../app.js";
import userService from "../../services/userService.js";
import ScheduleController from "../ScheduleController.js";
import teacherService from "../../services/teacherService.js";
import TeacherScheduleController from "../TeacherScheduleController.js";
import teacherScheduleController from "../TeacherScheduleController.js";
import i18next from "i18next";
import {criticalErrorController} from "../../exceptions/bot/criticalErrorController.js";

const errorCatch = async (e, msg) => {
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В teacherScheduleCommandController. Юзеру сказано что бот прибоел.` + e.message, {
        stack: e.stack,
        userId: msg.chat.id
    })
    await criticalErrorController(msg)
}

export async function sendUserTeacherSchedule(User, msg, answer) {
    const user_language = await userService.getUserLanguage(msg.chat.id)
    const teacherId = User.teacher

    const Teacher = await teacherService.getById(teacherId)
    if (!Teacher) {
        log.error(`!!! USER ${msg.chat.id} ИЩЕТ ПРЕПОДА КОТОРОГО НЕТ В БД. teacher:${teacherId}.`, {
            User,
            userId: msg.chat.id
        })
        const msg_text = i18next.t('teacher_not_found', {lng:user_language})
        return bot.editMessageText(msg_text, {
            chat_id: answer.chat.id, message_id: answer.message_id
        })
    }
    const day = ScheduleController.getCurrentDayNumber()

    const call = {
        data: `TeacherSchedule|${teacherId}|${day}`,
        message: answer
    }
    await TeacherScheduleController.getScheduleMenu(call)
}

export async function teacherScheduleCommandController(msg) {
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
            if (!User.teacher) {
                return await teacherScheduleController.getDepartmentMenu(answer, 0)
            }

            await sendUserTeacherSchedule(User, msg, answer)
        } catch (e) {
            await errorCatch(e, msg)
        }
    })
}