import log from "../../logging/logging.js";
import {bot} from "../../app.js";
import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import ScheduleController from "../ScheduleController.js";
import TeacherService from "../../services/teacherService.js";
import SearchTeacherController from "../SearchTeacherController.js";

const errorCatch = async (e, msg) => {
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В searchTeacherCommandController. Юзеру сказано что бот прибоел.` + e.message, {
        stack: e.stack,
        userId: msg.chat.id
    })
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}

export const searchTeacherMenuCache = {}

export async function searchTeacherCommandController(msg) {
    await commandAntiSpamMiddleware(msg, async () => {
        try {
            const splittedText = msg.text.split(" ")

            let teacherName = ''

            if (!splittedText[1] || splittedText[1].length < 2) {
                return await bot.sendMessage(msg.chat.id, '⚠️ Имя преподавателя должно состоять как минимум из 2 символов.')
            }

            teacherName = splittedText.slice(1).join(" ").replaceAll(" ", "-")

            const teachers = await TeacherService.findByName(teacherName)

            if (!teachers.length) {
                return await bot.sendMessage(msg.chat.id, `⚠️ К сожалению по запросу: <b>${teacherName}</b> ничего не найдено.\n` +
                    `✍️ Проверьте корректность ввода.\n` +
                    `Если всё в порядке и я не могу найти - значит сори 🙃`, {parse_mode: "HTML"})
            }

            searchTeacherMenuCache[teacherName] = {teachers: teachers, time: Date.now()}

            const {data, page, page_count} = ScheduleController.configureMenuData(teachers, 0)

            let markup = SearchTeacherController.getMenuMarkup(data, teacherName, page_count, page)

            await bot.sendMessage(msg.chat.id, `✅По вашему запросу: <b>${teacherName}</b> найдено ${teachers.length} преподавателя!🙉`, {
                reply_markup: markup,
                parse_mode: "HTML"
            })
        } catch (e) {
            await errorCatch();
        }
    })
}
