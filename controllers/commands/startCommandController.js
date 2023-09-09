import userService from "../../services/userService.js";
import log from "../../logging/logging.js";
import ScheduleController from "../ScheduleController.js";

export async function startCommandController(bot, msg) {
    const answer = await bot.sendMessage(msg.chat.id, "🪄 Пытаюсь накодовать список факультетов. Вжух!", {parse_mode: 'HTML'})

    try {
        await ScheduleController.getFacultyMenu(bot, answer, 0)
    } catch (e) {
        await this.errorHandler(e, bot, answer, "faculty|0")
    }

    // await bot.sendMessage(msg.chat.id, "Привет, я бот, который предоставляет расписание " +
    //     "Каргушников. Чье расписание тебе нужно?", {
    //     reply_markup: {
    //         inline_keyboard: [[{text: "Student", callback_data: "faculty|0"}],
    //             [{text: "Teacher", callback_data: "department|0"}]]
    //     }
    // })

    await userService.registerUser(msg).catch(e => log.error("Ошибка при попытке зарегистрировать пользователя: " + e.message, {stack:e.stack, userId: msg.chat.id}))

}