import log from "../../logging/logging.js";
import {bot} from "../../app.js";
import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import TeacherController from "../ProfileController.js";

const errorCatch = async (e, msg) =>{
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В profileCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack, userId: msg.chat.id})
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}


export async function profileCommandController(msg) {
    await commandAntiSpamMiddleware(msg, async () => {
        const splittedText = msg.text.split(" ")

        let surname = ''

        if (!splittedText[1] || splittedText[1].length<2){
            return await bot.sendMessage(msg.chat.id, '⚠️ Фамилия для поиска профиля должна состоять как минимум из 2 символов.')
                .catch(e => log.error("ВАЖНО! ОШИБКА В ПРОФИЛЬ КОМАНД ХЕДЛЕРЕ", {
                    stack: e.stack,
                    msg,
                    userId: msg.chat.id
                }))
        }else{
            surname = splittedText.slice(1).join(" ")
        }

        try {
            if (!surname) {
                await bot.sendMessage(msg.chat.id, '⚠️ После команды "профиль" должна быть указана фамилия.');
                return;
            }

            const answer = await bot.sendMessage(msg.chat.id, `🪄 Пытаюсь накодовать профиль препода с фамилией: ${surname}. Вжух!`, {parse_mode: 'HTML'});

            await TeacherController.findProfiles( answer, surname);
        } catch (e) {
            await errorCatch(e, msg)
        }
    });

}
