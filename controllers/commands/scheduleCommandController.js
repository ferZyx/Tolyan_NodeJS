import log from "../../logging/logging.js";
import ScheduleController from "../ScheduleController.js";
import userService from "../../services/userService.js";
import {startCommandController} from "./startCommandController.js";
import groupService from "../../services/groupService.js";
import teacherService from "../../services/teacherService.js";
import TeacherScheduleController from "../TeacherScheduleController.js";

export async function scheduleCommandController(bot, msg) {
    const answer = await bot.sendMessage(msg.chat.id, "🪄 Пытаюсь накодовать твое расписание. Вжух!", {parse_mode: 'HTML'})
    try {
        const User = await userService.getUserById(msg.chat.id)

        if (!User || !User.scheduleType) {
            await bot.deleteMessage(msg.chat.id, answer.message_id);
            return await startCommandController(bot, msg);
        }

        if (User.scheduleType === "student") {
            const groupId = User.group
            if (!groupId) {
                await bot.deleteMessage(msg.chat.id, answer.message_id);
                return await startCommandController(bot, msg);
            }
            const Group = await groupService.getById(groupId)
            if (!Group) {
                log.error(`!!! USER ${msg.chat.id} УЧИТСЯ В ГРУППЕ КОТОРОЙ НЕТ В БД.`, {User, userId: msg.chat.id})
                return bot.editMessageText("⚠️ Я не смог найти группу в которой ты учишься(\n" +
                    "2 варианта. Либо я сломался что вероятнее всего. Либо произошла какая то ошибка. \n" +
                    "Попробуй воспользоваться /start для получения расписания", {
                    chat_id: answer.chat.id, message_id: answer.message_id
                })
            }
            const language = Group.language
            const day = await ScheduleController.getCurrentDayNumber()

            const call = {
                data: `schedule|${language}|${groupId}|${day}`,
                message: answer
            }
            await ScheduleController.getScheduleMenu(bot, call)
        } else if (User.scheduleType === "teacher") {
            const teacherId = User.teacher
            if (!teacherId) {
                await bot.deleteMessage(msg.chat.id, answer.message_id);
                return await startCommandController(bot, msg);
            }
            const Teacher = await teacherService.getById(teacherId)
            if (!Teacher) {
                log.error(`!!! USER ${msg.chat.id} ИЩЕТ ПРЕПОДА КОТОРОГО НЕТ В БД.`, {User, userId: msg.chat.id})
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
            await TeacherScheduleController.getScheduleMenu(bot, call)
        } else {
            await bot.deleteMessage(msg.chat.id, answer.message_id);
            return await startCommandController(bot, msg);
        }
    } catch (e) {
        log.error("ОШИБКА В scheduleCommandHandler" + e.message, {stack: e.stack, userId: msg.chat.id})
        bot.sendMessage(msg.chat.id, "Бот временно не работает, попробуйте позже. ").catch(e => console.error(e))
    }
}