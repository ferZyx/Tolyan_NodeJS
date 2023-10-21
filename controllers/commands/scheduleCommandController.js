import log from "../../logging/logging.js";
import userService from "../../services/userService.js";
import {bot} from "../../app.js";
import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import {sendUserGroupSchedule} from "./groupScheduleCommandController.js";
import {sendUserTeacherSchedule} from "./teacherScheduleCommandController.js";
import {redirectToNewScheduleMenu} from "./newScheduleCommandController.js";
import i18next from "i18next";
import {criticalErrorController} from "../../exceptions/bot/criticalErrorController.js";

const errorCatch = async (e, msg) => {
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В scheduleCommandController. Юзеру сказано что бот прибоел.` + e.message, {
        stack: e.stack,
        userId: msg.chat.id
    })
    await criticalErrorController(msg)
}

export async function scheduleCommandController(msg) {
    await commandAntiSpamMiddleware(msg, async () => {
        const user_language = await userService.getUserLanguage(msg.chat.id)
        const msg_text = i18next.t('schedule_loading', {lng:user_language})

        const answer = await bot.sendMessage(msg.chat.id, `🪄 ${msg_text}`, {parse_mode: 'HTML'})
        try {
            const User = await userService.getUserById(msg.chat.id)

            if (!User || !User.scheduleType) {
                return await redirectToNewScheduleMenu(answer)
            }

            if (User.scheduleType === "student") {
                return await sendUserGroupSchedule(User, msg, answer)
            }
            if (User.scheduleType === "teacher") {
                return await sendUserTeacherSchedule(User, msg, answer)
            }
        } catch (e) {
            await errorCatch(e, msg)
        }
    })

}