import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import log from "../../logging/logging.js";
import config from "../../config.js";
import {bot} from "../../app.js";

const errorCatch = async (e, msg) =>{
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В donateCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack, userId: msg.chat.id})
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}

export async function donateCommandController(msg){
    await commandAntiSpamMiddleware(msg, async () => {
        try{
            log.warn(`User ${msg.chat.id} прописал /donate`, {userId: msg.chat.id})
            const msg_text = 'Над ботом активно работают 2 начинающих разработчика, которых вы можете поддержать, угостив ' +
                'их стаканом компота или даже кружечкой горячего кофе!\n Каспи: <code>4400430139065632</code>'
            await bot.sendMessage(msg.chat.id, msg_text, {parse_mode: 'HTML'})
            await bot.forwardMessage(config.LOG_CHANEL_ID, msg.chat.id, msg.message_id)
        }catch (e) {
            await errorCatch(e, msg)
        }
    })
}