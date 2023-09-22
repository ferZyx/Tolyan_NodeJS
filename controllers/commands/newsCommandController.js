import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import log from "../../logging/logging.js";
import {bot} from "../../app.js";

const errorCatch = async (e, msg) =>{
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В newsCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack, userId: msg.chat.id})
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}
export async function newsCommandController(msg){
    await commandAntiSpamMiddleware(msg, async () => {
        try{
            const msg_text = '👋 Рад что тебе интересно наше обновление!\n' +
                '\n' +
                '🟡Добавлено расписание ПРЕПОДАВАТЕЛЕЙ. Пиши /start и получай его! Не забудь рассказать об этом другим преподам!\n' +
                '⚫️Добавлена возможность просматривать профили преподавателей.\n' +
                '⚪️ Добавлена простейшая антиспам система которая не дает так просто тыкать на кнопочки и ломать меня полностью!'
            await bot.sendMessage(msg.chat.id, msg_text)
        }catch (e) {
            await errorCatch(e, msg)
        }
    })
}