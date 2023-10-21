import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import {bot} from "../../app.js";
import log from "../../logging/logging.js";
import userService from "../../services/userService.js";
import i18next from "i18next";
import {criticalErrorController} from "../../exceptions/bot/criticalErrorController.js";

const errorCatch = async (e, msg) =>{
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В searchHelpCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack, userId: msg.chat.id})
    await criticalErrorController(msg)
}

export async function searchHelpCommandController(msg){
    await commandAntiSpamMiddleware(msg, async () => {
        try{
            const user_language = await userService.getUserLanguage(msg.chat.id)

            const msg_text = i18next.t('search_command_content', {lng:user_language})

            await bot.sendMessage(msg.chat.id, msg_text, {parse_mode:"HTML"})
        }catch (e) {
            await errorCatch(e, msg)
        }
    })
}