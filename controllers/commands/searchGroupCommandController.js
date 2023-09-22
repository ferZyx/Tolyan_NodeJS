import log from "../../logging/logging.js";
import {bot} from "../../app.js";
import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";

const errorCatch = async (e, msg) =>{
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В searchGroupCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack, userId: msg.chat.id})
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}

export async function searchGroupCommandController(msg){
    await commandAntiSpamMiddleware(msg, async() => {
        try{
            const splittedText = msg.text.split(" ")

            let groupName = ''

            if (!splittedText[1] || splittedText[1].length<2){
                return await bot.sendMessage(msg.chat.id, '⚠️ Название группы должно состоять как минимум из 2 символов.')
            }else{
                groupName = splittedText.slice(1).join(" ")
            }


        }catch (e) {
            await errorCatch();
        }

    })
}