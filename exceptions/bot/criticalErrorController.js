import {bot} from "../../app.js";
import userService from "../../services/userService.js";
import i18next from "i18next";

export async function criticalErrorController(msg) {
    try{
        const user_language = await userService.getUserLanguage(msg.chat.id)

        const msg_text = i18next.t('bot_is_sick', {lng:user_language})
        await bot.sendMessage(msg.chat.id, msg_text)
    }catch (e) {
        console.log(e)
    }
}