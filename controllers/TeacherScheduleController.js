import facultyService from "../services/facultyService.js";
import departmentService from "../services/departmentService.js";

class TeacherScheduleController{
    async getDepartmentMenu(bot, message, prePage){
        try {
            const departments = await departmentService.getAll()

            const {data, page, page_count} = configureMenuData(departments, prePage)

            let markup = getRowMarkup(data, 'program')

            if (page_count > 0) {
                markup.inline_keyboard.push([{text: '⬅️', callback_data: `department|${page - 1}`}, {
                    text: '➡️', callback_data: `department|${page + 1}`
                }])
            }

            await bot.editMessageText(`🏛️Выберите кафедру. \n` +
            `📄 Страница: ${Number(page) + 1} из ${page_count + 1}`, {
                chat_id: message.chat.id, message_id: message.message_id, reply_markup: markup
            })

        } catch (e) {
            throw e
        }
    }
}

export default new TeacherScheduleController()