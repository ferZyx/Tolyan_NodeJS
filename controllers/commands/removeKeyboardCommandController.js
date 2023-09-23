import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import log from "../../logging/logging.js";
import {bot} from "../../app.js";

const errorCatch = async (e, msg) =>{
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В removeKeyboardCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack, userId: msg.chat.id})
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}

export async function removeKeyboardCommandController(msg){
    await commandAntiSpamMiddleware(msg, async() => {
        try{
            await bot.sendMessage(msg.chat.id,  "Удалил кнопочки. Если будут нужны - /start", {reply_markup:{remove_keyboard:true}})
        }catch (e) {
            await errorCatch()
        }
    })
}