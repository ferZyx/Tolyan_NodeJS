import log from "../../logging/logging.js";
import { bot } from "../../app.js";
import { commandAntiSpamMiddleware } from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import ScheduleController from "../ScheduleController.js";
import TeacherService from "../../services/teacherService.js";
import SearchTeacherController from "../SearchTeacherController.js";
import userService from "../../services/userService.js";
import i18next from "i18next";
import {criticalErrorController} from "../../exceptions/bot/criticalErrorController.js";

const errorCatch = async (e, msg) => {
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В searchTeacherCommandController. Юзеру сказано что бот прибоел.` + e.message, {
        stack: e.stack,
        userId: msg.chat.id
    })
    await criticalErrorController(msg)
}

export const searchTeacherMenuCache = {}

export async function searchTeacherCommandController(msg) {
    await commandAntiSpamMiddleware(msg, async () => {
        try {
            const user_language = await userService.getUserLanguage(msg.chat.id)

            const splittedText = msg.text.split(" ")

            let teacherName = ''

            if (!splittedText[1] || splittedText[1].length < 2) {
                const msg_text = i18next.t('teacher_search_validation_error', { lng: user_language })
                return await bot.sendMessage(msg.chat.id, msg_text)
            }

            teacherName = splittedText.slice(1).join(" ").replaceAll(" ", "-")

            const teachers = await TeacherService.findByName(teacherName)

            if (!teachers.length) {
                const msg_text = i18next.t('search_bad_result', { lng: user_language, searchQuery: teacherName })
                return await bot.sendMessage(msg.chat.id, msg_text, { parse_mode: "HTML" })
            }

            searchTeacherMenuCache[teacherName] = { teachers: teachers, time: Date.now() }

            const { data, page, page_count } = ScheduleController.configureMenuData(teachers, 0)

            let markup = SearchTeacherController.getMenuMarkup(data, teacherName, page_count, page)

            const msg_text = i18next.t('teacher_seactch_success_result', {lng:user_language, searchQuery:teacherName, searchCountResult:teachers.length})
            await bot.sendMessage(msg.chat.id, msg_text, {
                reply_markup: markup,
                parse_mode: "HTML"
            })
        } catch (e) {
            await errorCatch();
        }
    })
}
