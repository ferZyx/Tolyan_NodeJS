import log from "../../logging/logging.js";
import {bot} from "../../app.js";
import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import ProfileController from "../ProfileController.js";
import userService from "../../services/userService.js";
import i18next from "i18next";
import {criticalErrorController} from "../../exceptions/bot/criticalErrorController.js";

const errorCatch = async (e, msg) =>{
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В profileCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack, userId: msg.chat.id})
    await criticalErrorController(msg)
}


export async function profileCommandController(msg) {
    await commandAntiSpamMiddleware(msg, async () => {
        const user_language = await userService.getUserLanguage(msg.chat.id)

        const splittedText = msg.text.split(" ")
        let surname = splittedText.slice(1).join(" ")

        try {
            if (!surname) {
                const msg_text = i18next.t('profile_surname_validation', {lng:user_language})
                return await bot.sendMessage(msg.chat.id, msg_text);
            }
            if (surname.length < 2){
                const msg_text = i18next.t('profile_surname_length_validation', {lng:user_language})
                return await bot.sendMessage(msg.chat.id, msg_text);
            }

            await ProfileController.findProfiles(msg, surname);
        } catch (e) {
            await errorCatch(e, msg)
        }
    });

}
