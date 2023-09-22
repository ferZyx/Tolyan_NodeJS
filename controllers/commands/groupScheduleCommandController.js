import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import {bot} from "../../app.js";
import userService from "../../services/userService.js";
import groupService from "../../services/groupService.js";
import log from "../../logging/logging.js";
import ScheduleController from "../ScheduleController.js";

const errorCatch = async (e, msg) => {
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В groupScheduleCommandController. Юзеру сказано что бот прибоел.` + e.message, {
        stack: e.stack,
        userId: msg.chat.id
    })
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}

export async function sendUserGroupSchedule(User, msg, answer) {
    const groupId = User.group

    const Group = await groupService.getById(groupId)
    if (!Group) {
        log.error(`!!! USER ${msg.chat.id} УЧИТСЯ В ГРУППЕ КОТОРОЙ НЕТ В БД. group: ${groupId}. `, {
            User,
            userId: msg.chat.id
        })
        return bot.sendMessage(msg.chat.id, "⚠️ Я не смог найти группу в которой ты учишься(\n" +
            "2 варианта. Либо я сломался что вероятнее всего. Либо произошла какая то ошибка. \n" +
            "Попробуй воспользоваться /start для получения расписания повторно.")
    }
    const language = Group.language
    const day = await ScheduleController.getCurrentDayNumber()

    const call = {
        data: `schedule|${language}|${groupId}|${day}`,
        message: answer
    }
    await ScheduleController.getScheduleMenu(call)
}

export async function groupScheduleCommandController(msg) {
    await commandAntiSpamMiddleware(msg, async () => {
        const answer = await bot.sendMessage(msg.chat.id, "🪄 Пытаюсь накодовать расписание группы. Вжух!", {parse_mode: 'HTML'})
        try {
            const User = await userService.getUserById(msg.chat.id)

            if (!User) {
                await bot.deleteMessage(msg.chat.id, answer.message_id);
                return await bot.sendMessage(msg.chat.id, `❗️ Я тебя не знаю! Воспользуйся /start для регистрации!`)
            }
            if (!User.group) {
                await bot.deleteMessage(msg.chat.id, answer.message_id);
                return await bot.sendMessage(msg.chat.id, `❗️ У вас нет ранее загруженного студенческого расписания! Воспользуйтесь кнопочкой "🗒 Новое расписание"`)
            }

            await sendUserGroupSchedule(User, msg, answer)
        } catch (e) {
            await errorCatch(e, msg)
        }
    })
}