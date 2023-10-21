import log from "../../logging/logging.js";
import {bot} from "../../app.js";
import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import GroupService from "../../services/groupService.js";
import ScheduleController from "../ScheduleController.js";
import SearchGroupController from "../SearchGroupController.js";
import userService from "../../services/userService.js";
import i18next from "i18next";
import {criticalErrorController} from "../../exceptions/bot/criticalErrorController.js";

const errorCatch = async (e, msg) =>{
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В searchGroupCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack, userId: msg.chat.id})
    await criticalErrorController(msg)
}

export const searchGroupMenuCache = {}

export async function searchGroupCommandController(msg){
    await commandAntiSpamMiddleware(msg, async() => {
        try{
            const user_language = await userService.getUserLanguage(msg.chat.id)

            const splittedText = msg.text.split(" ")

            let groupName = splittedText.slice(1).join(" ").replaceAll(" ", "-")

            if (!groupName || groupName.length<2){
                const msg_text = i18next.t('group_search_validation_error', {lng:user_language})
                return await bot.sendMessage(msg.chat.id, msg_text)
            }

            groupName = splittedText.slice(1).join(" ").replaceAll(" ", "-")

            const groups = await GroupService.findByName(groupName)

            if (!groups.length){
                const msg_text = i18next.t('search_bad_result', {lng:user_language, searchQuery:groupName})
                return await bot.sendMessage(msg.chat.id, msg_text, {parse_mode:"HTML"})
            }

            searchGroupMenuCache[groupName] = {groups, time:Date.now()}

            const {data, page, page_count} = ScheduleController.configureMenuData(groups, 0)

            let markup = SearchGroupController.getMenuMarkup(data, groupName, page_count, page)
            
            const msg_text = i18next.t('group_search_success_result', {lng:user_language, searchQuery:groupName, searchCountResult:groups.length})
            await bot.sendMessage(msg.chat.id, msg_text, {reply_markup:markup, parse_mode:"HTML"})
        }catch (e) {
            await errorCatch();
        }
    })
}