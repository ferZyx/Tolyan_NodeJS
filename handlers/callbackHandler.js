import ScheduleController from "../controllers/ScheduleController.js";
import log from "../logging/logging.js";
import {schedule_cache} from "../controllers/ScheduleController.js";
import TeacherController from "../controllers/TeacherController.js";

export default function setupCallbackHandlers(bot) {
    bot.on('callback_query', async (call) => {
        log.silly(`User ${call.message.chat.id} clicked to btn ${call.data}`, {call, userId:call.message.chat.id})

        if (call.data.includes("faculty")) {
            try {
                const [, page] = call.data.split('|');
                if (!page) {
                    return ScheduleController.validateErrorHandler(bot, call)
                }
                await ScheduleController.getFacultyMenu(bot, call.message, +page)
            } catch (e) {
                await ScheduleController.errorHandler(e, bot, call.message, call.data)
            }

        } else if (call.data.includes("program")) {
            try {
                const [, facultyId, page] = call.data.split('|');
                if (!facultyId || !page) {
                    return ScheduleController.validateErrorHandler(bot, call)
                }
                await ScheduleController.getProgramMenu(bot, call.message, facultyId, +page)
            } catch (e) {
                await ScheduleController.errorHandler(e, bot, call.message, call.data)
            }
        } else if (call.data.includes("group")) {
            try {
                const [, facultyId, programId, page] = call.data.split('|');
                if (!facultyId || !programId || !page) {
                    return ScheduleController.validateErrorHandler(bot, call)
                }
                await ScheduleController.getGroupMenu(bot, call.message, programId, facultyId, +page)
            } catch (e) {
                await ScheduleController.errorHandler(e, bot, call.message, call.data)
            }
        } else if (call.data.includes("schedule")) {
            if (call.data.split("|").length < 2) {
                try {
                    await bot.sendMessage(call.message.chat.id, "❗️ Секундочку, я эволюционирую.")
                    return await ScheduleController.getSchedule(bot, call.message)
                } catch (e) {
                    log.error("ВАЖНО! ОШИБКА В ШЕДУЛ КОЛБЕК ХЕНДЕРЕ ПРИ ПОПЫТКЕ ЭВОЛЮЦИОНИРОВАТЬ!", {
                        stack: e.stack, call
                    })
                }
            }

            const [, , groupId,] = call.data.split("|")
            if (!groupId) {
                return ScheduleController.validateErrorHandler(bot, call)
            }
            if (call.data.includes("refresh")) {
                delete schedule_cache[groupId]
                call.data = call.data.replace('refresh', '')
            }
            try {
                await ScheduleController.getScheduleMenu(bot, call)
            } catch (e) {
                log.error("ОШИБКА В КОЛБЕК ХЕНДЕЛЕРЕ schedule", {stack:e.stack})
            }

        } else if (call.data.includes("teacher")) {
            try {
                const [, _id] = call.data.split("|")
                await TeacherController.getProfile(bot, call, _id)
            } catch (e) {
                log.error("ВАЖНО! ОШИБКА В ТИЧЕР КОЛБЕК ХЕНДЛЕРЕ!", {stack: e.stack, call})
            }
            await bot.answerCallbackQuery(call.id)
        } else {
            return ScheduleController.validateErrorHandler(bot, call)
                .catch(e => log.error("ВАЖНО. ОШИБКА В ГОВНО-ХЕДЛЕРЕ ПРИ ПОПЫТКЕ ПРОИНФОРМИРОВАТЬ ЮЗЕРА ОБ ОШИБКЕ!", {
                    stack: e.stack, call
                }))
        }
    })
}
