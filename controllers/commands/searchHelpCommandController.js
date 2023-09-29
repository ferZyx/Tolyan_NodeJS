import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import {bot} from "../../app.js";
import log from "../../logging/logging.js";

const errorCatch = async (e, msg) =>{
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В searchHelpCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack, userId: msg.chat.id})
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}

export async function searchHelpCommandController(msg){
    await commandAntiSpamMiddleware(msg, async () => {
        try{
            const msg_text = '<b>Для поиска расписания ты можешь использовать следующие команды:</b>\n\n' +
                '📌Преподаватель [фамилия]\n' +
                '📌Группа [название]\n Или проще 👇\n' +
                '📌П [фамилия]\n' +
                '📌Г [название]\n' +
                'Например "Г гении 23-3"\n\n' +
                'Команды нужно писать мне в чат. Если что то не понятно - можете писать напрямую разработчикам @lena_nebot'

            await bot.sendMessage(msg.chat.id, msg_text, {parse_mode:"HTML"})
        }catch (e) {
            await errorCatch(e, msg)
        }
    })
}