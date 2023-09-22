import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import log from "../../logging/logging.js";
import {bot} from "../../app.js";
import userService from "../../services/userService.js";
import ScheduleController from "../ScheduleController.js";
import teacherService from "../../services/teacherService.js";
import TeacherScheduleController from "../TeacherScheduleController.js";

const errorCatch = async (e, msg) => {
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В teacherScheduleCommandController. Юзеру сказано что бот прибоел.` + e.message, {
        stack: e.stack,
        userId: msg.chat.id
    })
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}

export async function sendUserTeacherSchedule(User, msg, answer) {
    const teacherId = User.teacher

    const Teacher = await teacherService.getById(teacherId)
    if (!Teacher) {
        log.error(`!!! USER ${msg.chat.id} ИЩЕТ ПРЕПОДА КОТОРОГО НЕТ В БД. teacher:${teacherId}.`, {
            User,
            userId: msg.chat.id
        })
        return bot.editMessageText("⚠️ Я не смог найти данного преподавателя(\n" +
            "2 варианта. Либо я сломался что вероятнее всего. Либо произошла какая то ошибка. \n" +
            "Попробуй воспользоваться /start для повторной регистрации", {
            chat_id: answer.chat.id, message_id: answer.message_id
        })
    }
    const day = await ScheduleController.getCurrentDayNumber()

    const call = {
        data: `TeacherSchedule|${teacherId}|${day}`,
        message: answer
    }
    await TeacherScheduleController.getScheduleMenu(call)
}

export async function teacherScheduleCommandController(msg) {
    await commandAntiSpamMiddleware(msg, async () => {
        const answer = await bot.sendMessage(msg.chat.id, "🪄 Пытаюсь накодовать расписание преподавателя. Вжух!", {parse_mode: 'HTML'})
        try {
            const User = await userService.getUserById(msg.chat.id)

            if (!User) {
                await bot.deleteMessage(msg.chat.id, answer.message_id);
                return await bot.sendMessage(msg.chat.id, "❗️ Я тебя не знаю! Воспользуйся /start для регистрации!")
            }
            if (!User.teacher) {
                await bot.deleteMessage(msg.chat.id, answer.message_id);
                return await bot.sendMessage(msg.chat.id, "❗️ У вас нет загруженного ранее расписания преподавателя! Воспользуйтесь кнопочкой \"🗒 Новое расписание\"")
            }

            await sendUserTeacherSchedule(User, msg, answer)
        } catch (e) {
            await errorCatch(e, msg)
        }
    })
}