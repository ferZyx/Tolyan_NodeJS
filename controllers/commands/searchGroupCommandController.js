import log from "../../logging/logging.js";
import {bot} from "../../app.js";
import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import GroupService from "../../services/groupService.js";
import ScheduleController from "../ScheduleController.js";

const errorCatch = async (e, msg) =>{
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В searchGroupCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack, userId: msg.chat.id})
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}

export const searchGroupMenuCache = {}

export async function searchGroupCommandController(msg){
    await commandAntiSpamMiddleware(msg, async() => {
        try{
            const splittedText = msg.text.split(" ")

            let groupName = ''

            if (!splittedText[1] || splittedText[1].length<2){
                return await bot.sendMessage(msg.chat.id, '⚠️ Название группы должно состоять как минимум из 2 символов.')
            }

            groupName = splittedText.slice(1).join(" ").replaceAll(" ", "-")

            const groups = await GroupService.findByName(groupName)
            if (!groups.length){
                await bot.sendMessage(msg.chat.id, `⚠️ К сожалению по запросу: <b>${groupName}</b> ничего не найдено.\n` +
                    `✍️ Проверьте корректность ввода.\n` +
                    `Если всё в порядке и я не могу найти - значит сори 🙃`, {parse_mode:"HTML"})
            }

            let markup = {
                inline_keyboard: groups.slice(0, 10).map((group) => [{
                    text: group.name, callback_data: `schedule|${group.language}|${group.id}|${ScheduleController.getCurrentDayNumber()}`
                }])
            }

            await bot.sendMessage(msg.chat.id, groupName, {reply_markup:markup})


        }catch (e) {
            await errorCatch();
        }
    })
}