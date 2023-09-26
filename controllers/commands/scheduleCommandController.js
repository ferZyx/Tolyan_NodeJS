import log from "../../logging/logging.js";
import userService from "../../services/userService.js";
import {bot} from "../../app.js";
import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import {sendUserGroupSchedule} from "./groupScheduleCommandController.js";
import {sendUserTeacherSchedule} from "./teacherScheduleCommandController.js";
import {redirectToNewScheduleMenu} from "./newScheduleCommandController.js";

const errorCatch = async (e, msg) => {
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В scheduleCommandController. Юзеру сказано что бот прибоел.` + e.message, {
        stack: e.stack,
        userId: msg.chat.id
    })
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}

export async function scheduleCommandController(msg) {
    await commandAntiSpamMiddleware(msg, async () => {
        const answer = await bot.sendMessage(msg.chat.id, "🪄 Пытаюсь накодовать последнее загруженное тобой расписание. Вжух!", {parse_mode: 'HTML'})
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