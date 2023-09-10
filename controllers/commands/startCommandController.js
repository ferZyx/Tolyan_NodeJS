import userService from "../../services/userService.js";
import log from "../../logging/logging.js";

export async function startCommandController(bot, msg) {
    try {
        await bot.sendMessage(msg.chat.id, "👋 Чье расписание тебе нужно?", {
            reply_markup: {
                inline_keyboard: [[{text: "🤓 Студент", callback_data: "faculty|0"}],
                    [{text: "👩‍🏫 Преподаватель", callback_data: "department|0"}]]
            }
        })
    } catch (e) {
        log.error("ОШИБКА В startCommandController" + e.message, {stack:e.stack, userId: msg.chat.id})
        bot.sendMessage(msg.chat.id, "Бот временно не работает, попробуйте позже. ").catch(e => console.error(e))
    }finally {
        await userService.registerUser(msg).catch(e => log.error("Ошибка при попытке зарегистрировать пользователя: " + e.message, {stack:e.stack, userId: msg.chat.id}))
    }




}