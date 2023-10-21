import {searchGroupMenuCache} from "./commands/searchGroupCommandController.js";
import GroupService from "../services/groupService.js";
import log from "../logging/logging.js";
import {bot} from "../app.js";
import ScheduleController from "./ScheduleController.js";
import {criticalErrorController} from "../exceptions/bot/criticalErrorController.js";

class SearchGroupController {
    async errorCatch(e, message) {
        log.error(`User ${message.chat.id} get an error at SearchGroupController.` + e.message, {
            stack: e.stack, message
        });
        await criticalErrorController(message)
    }

    getMenuMarkup(data, groupName, page_count, page) {
        let markup = ScheduleController.getGroupsRowMarkup(data)

        if (page_count) {
            markup.inline_keyboard.push([{
                text: '⬅️Назад', callback_data: `searchGroup|${groupName}|${page - 1}`
            },
                {text: `📄 ${Number(page) + 1} из ${page_count + 1}`, callback_data: `nothing`},
                {text: 'Вперед➡️', callback_data: `searchGroup|${groupName}|${page + 1}`}])
        }
        return markup
    }

    async getSearchGroupMenu(msg, groupName, prePage) {
        try {
            if (!(groupName in searchGroupMenuCache) || (Date.now() - searchGroupMenuCache[groupName].time) > 30 * 60 * 1000) {
                searchGroupMenuCache[groupName] = {groups: (await GroupService.findByName(groupName)), time: Date.now()}
            }
            const groups = searchGroupMenuCache[groupName].groups

            const {data, page, page_count} = ScheduleController.configureMenuData(groups, prePage)

            let markup = this.getMenuMarkup(data, groupName, page_count, page)

            await bot.editMessageText(msg.text, {
                message_id: msg.message_id,
                chat_id: msg.chat.id,
                reply_markup: markup,
                parse_mode: "HTML"
            })
        } catch (e) {
            await this.errorCatch(e, msg)
        }

    }
}

export default new SearchGroupController()

