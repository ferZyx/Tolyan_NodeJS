import log from "../logging/logging.js";
import {bot} from "../app.js";
import {searchTeacherMenuCache} from "./commands/searchTeacherCommandController.js";
import TeacherService from "../services/teacherService.js";
import ScheduleController from "./ScheduleController.js";
import TeacherScheduleController from "./TeacherScheduleController.js";


class SearchTeacherController{
    async errorCatch(e, message) {
        log.error(`User ${message.chat.id} get an error at SearchTeacherController.` + e.message, {
            stack: e.stack, message
        });
        await bot.editMessageText('⚠️ Я не знаю что произошло, но по какой-то никому неизвестной причине произошла ошибочка. Не переживай, фиксики уже в пути. Прости(', {
            chat_id: message.chat.id, message_id: message.message_id
        });
    }

    getMenuMarkup(data, teacherName, page_count, page) {
        let markup = TeacherScheduleController.getTeachersRowMarkup(data)

        if (page_count) {
            markup.inline_keyboard.push([{
                text: '⬅️Назад', callback_data: `searchTeacher|${teacherName}|${page - 1}`
            },
                {text: `📄 ${Number(page) + 1} из ${page_count + 1}`, callback_data: `nothing`},
                {text: 'Вперед➡️', callback_data: `searchTeacher|${teacherName}|${page + 1}`}])
        }
        return markup
    }

    async getSearchTeacherMenu(msg, teacherName, prePage){
        try{
            if (!(teacherName in searchTeacherMenuCache) || (Date.now() - searchTeacherMenuCache[teacherName].time) > 30 * 60 * 1000) {
                searchTeacherMenuCache[teacherName] = {teachers: (await TeacherService.findByName(teacherName)), time: Date.now()}
            }
            const teachers = searchTeacherMenuCache[teacherName].teachers

            const {data, page, page_count} = ScheduleController.configureMenuData(teachers, prePage)

            let markup = this.getMenuMarkup(data, teacherName, page_count, page)

            await bot.editMessageText(msg.text, {
                message_id: msg.message_id,
                chat_id: msg.chat.id,
                reply_markup: markup,
                parse_mode: "HTML"
            })
        }catch (e) {
            await this.errorCatch()
        }
    }

}
export default new SearchTeacherController()