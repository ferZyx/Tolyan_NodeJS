import userService from "../../services/userService.js";
import log from "../../logging/logging.js";
import {bot} from "../../app.js";
import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";

const keyboard = {
    inline_keyboard: [[{text: "🤓 Студент", callback_data: "faculty|0"}],
        [{text: "👩‍🏫 Преподаватель", callback_data: "department|0"}],
        [{text: " ", callback_data: "nothing"},
            {text: "❌", callback_data: "delete"},
            {text: " ", callback_data: "nothing"}]
    ]
}

const msg_text = "⚙️ Главное меню\n👋 Чье расписание тебе нужно?"

const errorCatch = async (e, msg) =>{
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В startCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack})
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}



export async function startCommandController(msg) {
    await commandAntiSpamMiddleware(msg, async () => {
        try {
            await bot.sendMessage(msg.chat.id, msg_text, {
                reply_markup: keyboard
            })

        } catch (e) {
             await errorCatch(e, msg)
        } finally {
            await userService.registerUser(msg)
                .catch(e => log.error("Ошибка при попытке зарегистрировать пользователя. Юзер никак не пострадал: " + e.message, {
                    stack: e.stack,
                    userId: msg.chat.id
                }))
        }
    });

}

export async function redirectToStartMenu(call) {
    try {
        await bot.editMessageText("👋 Чье расписание тебе нужно?", {
            chat_id: call.message.chat.id, message_id: call.message.message_id,
            reply_markup: {
                inline_keyboard: [[{text: "🤓 Студент", callback_data: "faculty|0"}],
                    [{text: "👩‍🏫 Преподаватель", callback_data: "department|0"}]]
            }
        })
    } catch (e) {
        await errorCatch(e, call.message)
    } finally {
        await userService.registerUser(call.message).catch(e => log.error("Ошибка при попытке зарегистрировать пользователя: " + e.message, {
            stack: e.stack,
            userId: call.message.chat.id
        }))
    }
}
