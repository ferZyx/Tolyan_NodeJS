import userService from "../../services/userService.js";
import log from "../../logging/logging.js";
import {bot} from "../../app.js";
import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";

const keyboard = {
    keyboard: [[{text: '📢 Новости'}, {text: '🗒 Новое расписание'}, {text: '💡 Помощь'}],
        [{text: '🗓 Расписание преподавателя'}, {text: '🗓 Расписание студента'}],

    ],
    resize_keyboard: true,
    one_time_keyboard: false
}

const msg_text = "🧙 Рад тебя видеть! Для получения расписания воспользуйся кнопочками снизу или командами, которые ты можешь найти в /help"

const errorCatch = async (e, msg) => {
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В startCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack})
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}

export async function startCommandController(msg) {
    await commandAntiSpamMiddleware(msg, async () => {
        try {
            await bot.sendMessage(msg.chat.id, msg_text, {reply_markup: keyboard})
        } catch (e) {
            await errorCatch(e, msg)
        } finally {
            await userService.registerUser(msg)
                .catch(e => log.error("Ошибка при попытке зарегистрировать пользователя. Юзер никак не пострадал: " + e.message, {
                    stack: e.stack, userId: msg.chat.id
                }))
        }
    });
}