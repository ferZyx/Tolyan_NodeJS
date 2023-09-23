import log from "../../logging/logging.js";
import {bot} from "../../app.js";
import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import GroupService from "../../services/groupService.js";
import ScheduleController from "../ScheduleController.js";
import SearchGroupController from "../SearchGroupController.js";

const errorCatch = async (e, msg) =>{
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В searchGroupCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack, userId: msg.chat.id})
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}

export const searchGroupMenuCache = {}

export async function searchGroupCommandController(msg){
    await commandAntiSpamMiddleware(msg, async() => {
        try{
            const splittedText = msg.text.split(" ")

            let groupName = splittedText.slice(1).join(" ").replaceAll(" ", "-")

            if (!groupName || groupName.length<2){
                return await bot.sendMessage(msg.chat.id, '⚠️ Название группы должно состоять как минимум из 2 символов.')
            }

            groupName = splittedText.slice(1).join(" ").replaceAll(" ", "-")

            const groups = await GroupService.findByName(groupName)

            if (!groups.length){
                return await bot.sendMessage(msg.chat.id, `⚠️ К сожалению по запросу: <b>${groupName}</b> ничего не найдено.\n` +
                    `✍️ Проверьте корректность ввода.\n` +
                    `Если всё в порядке и я не могу найти - значит сори 🙃`, {parse_mode:"HTML"})
            }

            searchGroupMenuCache[groupName] = {groups, time:Date.now()}

            const {data, page, page_count} = ScheduleController.configureMenuData(groups, 0)

            let markup = SearchGroupController.getMenuMarkup(data, groupName, page_count, page)

            await bot.sendMessage(msg.chat.id, `✅По вашему запросу: <b>${groupName}</b> найдено ${groups.length} групп!🙉`, {reply_markup:markup, parse_mode:"HTML"})
        }catch (e) {
            await errorCatch();
        }
    })
}