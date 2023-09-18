import ScheduleController from "../controllers/ScheduleController.js";
import log from "../logging/logging.js";
import {schedule_cache} from "../controllers/ScheduleController.js";
import {callbackAntiSpamMiddleware} from "../middlewares/bot/callbackAntiSpamMiddleware.js";
import ProfileController from "../controllers/ProfileController.js";
import {queryValidationErrorController} from "../exceptions/bot/queryValidationErrorController.js";
import {unexpectedErrorController} from "../exceptions/bot/unexpectedErrorController.js";
import TeacherScheduleController from "../controllers/TeacherScheduleController.js";
import {redirectToStartMenu} from "../controllers/commands/startCommandController.js";

export default function setupCallbackHandlers(bot) {
    bot.on('callback_query', async (call) => {
        log.silly(`User ${call.message.chat.id} clicked to btn ${call.data}`, {call, userId: call.message.chat.id})
        await callbackAntiSpamMiddleware(bot, call, async () => {
            if (call.data === 'start'){
                await redirectToStartMenu(bot, call)
            }

            if (call.data.includes("faculty")) {
                try {
                    const [, page] = call.data.split('|');
                    if (isNaN(page)) {
                        return await queryValidationErrorController(bot, call)
                    }
                    await ScheduleController.getFacultyMenu(bot, call.message, +page)
                } catch (e) {
                    return await unexpectedErrorController(e, bot, call.message, call.data)
                }

            }

            if (call.data.includes("program")) {
                try {
                    const [, facultyId, page] = call.data.split('|');
                    if (!facultyId || !page) {
                        return await queryValidationErrorController(bot, call)

                    }
                    await ScheduleController.getProgramMenu(bot, call.message, facultyId, +page)
                } catch (e) {
                    return await unexpectedErrorController(e, bot, call.message, call.data)
                }
            }

            if (call.data.includes("group")) {
                try {
                    const [, facultyId, programId, page] = call.data.split('|');
                    if (!facultyId || !programId || !page) {
                        return await queryValidationErrorController(bot, call)

                    }
                    await ScheduleController.getGroupMenu(bot, call.message, programId, facultyId, +page)
                } catch (e) {
                    return await unexpectedErrorController(e, bot, call.message, call.data)
                }
            }

            if (call.data.includes("schedule")) {
                if (call.data.split("|").length < 2) {
                    return await queryValidationErrorController(bot, call)
                }

                const [, , groupId,] = call.data.split("|")
                if (!groupId) {
                    return await queryValidationErrorController(bot, call)
                }
                if (call.data.includes("refresh")) {
                    delete schedule_cache[groupId]
                    call.data = call.data.replace('refresh', '')
                }
                try {
                    await ScheduleController.getScheduleMenu(bot, call)
                } catch (e) {
                    console.error(e)
                    log.error("ОШИБКА В КОЛБЕК ХЕНДЕЛЕРЕ schedule", {userId: call.message.chat.id, stack: e.stack})
                }

            }

            if (call.data.includes("profile")) {
                try {
                    const [, _id] = call.data.split("|")
                    await ProfileController.getProfile(bot, call, _id)
                } catch (e) {
                    console.error(e)
                    log.error("ВАЖНО! ОШИБКА В PROFILE КОЛБЕК ХЕНДЛЕРЕ!", {userId: call.message.chat.id, stack: e.stack})
                }
            }

            if (call.data.includes("department")){
                try {
                    const [, page] = call.data.split('|');
                    if (isNaN(page)) {
                        return await queryValidationErrorController(bot, call)
                    }
                    await TeacherScheduleController.getDepartmentMenu(bot, call.message, +page)
                } catch (e) {
                    return await unexpectedErrorController(e, bot, call.message, call.data)
                }
            }

            if (call.data.includes("teacher")){
                try {
                    const [,departmentId, page] = call.data.split('|');
                    if (isNaN(page)) {
                        return await queryValidationErrorController(bot, call)
                    }
                    await TeacherScheduleController.getTeacherMenu(bot, call.message,departmentId, +page)
                } catch (e) {
                    return await unexpectedErrorController(e, bot, call.message, call.data)
                }
            }

            if (call.data.includes("TeacherSchedule")) {
                const [, teacherId,] = call.data.split("|")
                if (!teacherId) {
                    return await queryValidationErrorController(bot, call)
                }
                if (call.data.includes("refresh")) {
                    delete schedule_cache[teacherId]
                    call.data = call.data.replace('refresh', '')
                }
                try {
                    await TeacherScheduleController.getScheduleMenu(bot, call)
                } catch (e) {
                    console.error(e)
                    log.error("ОШИБКА В КОЛБЕК ХЕНДЕЛЕРЕ teacherSchedule", {userId: call.message.chat.id, stack: e.stack})
                }

            }
            await bot.answerCallbackQuery(call.id).catch(e => log.info("Ошибка с ответов на колбек" + e.message))
        })

    })
}
