import ScheduleController from "../controllers/ScheduleController.js";
import log from "../logging/logging.js";
import {schedule_cache} from "../controllers/ScheduleController.js";
import {callbackAntiSpamMiddleware} from "../middlewares/bot/callbackAntiSpamMiddleware.js";
import ProfileController from "../controllers/ProfileController.js";
import {queryValidationErrorController} from "../exceptions/bot/queryValidationErrorController.js";
import {unexpectedErrorController} from "../exceptions/bot/unexpectedErrorController.js";
import TeacherScheduleController from "../controllers/TeacherScheduleController.js";
import {bot} from "../app.js";
import SearchGroupController from "../controllers/SearchGroupController.js";
import SearchTeacherController from "../controllers/SearchTeacherController.js";

export default function setupCallbackHandlers() {
    bot.on('callback_query', async (call) => {
        log.silly(`User ${call.message.chat.id} clicked to btn ${call.data}`, {call, userId: call.message.chat.id})
        await callbackAntiSpamMiddleware(call, async () => {
            if (call.data === "delete") {
                await bot.deleteMessage(call.message.chat.id, call.message.message_id)
                    .catch((e) => log.warn(`User ${call.message.chat.id} получил ошибку при попытке удалить менюшку. Юзер никак не пострадал.` + e.message, {stack: e.stack}))
            }

            if (call.data.includes("faculty|")) {
                try {
                    const [, page] = call.data.split('|');
                    if (isNaN(parseFloat(page))) {
                        return await queryValidationErrorController(call)
                    }
                    await ScheduleController.getFacultyMenu(call.message, +page)
                } catch (e) {
                    return await unexpectedErrorController(e, call.message, call.data)
                }

            }

            if (call.data.includes("program|")) {
                try {
                    const [, facultyId, page] = call.data.split('|');
                    if (!facultyId || !page) {
                        return await queryValidationErrorController(call)

                    }
                    await ScheduleController.getProgramMenu(call.message, facultyId, +page)
                } catch (e) {
                    return await unexpectedErrorController(e, call.message, call.data)
                }
            }

            if (call.data.includes("group|")) {
                try {
                    const [, facultyId, programId, page] = call.data.split('|');
                    if (!facultyId || !programId || !page) {
                        return await queryValidationErrorController(call)

                    }
                    await ScheduleController.getGroupMenu(call.message, programId, facultyId, +page)
                } catch (e) {
                    return await unexpectedErrorController(e, call.message, call.data)
                }
            }

            if (call.data.includes("schedule|")) {
                if (call.data.split("|").length < 2) {
                    return await queryValidationErrorController(call)
                }

                const [, , groupId,] = call.data.split("|")
                if (!groupId) {
                    return await queryValidationErrorController(call)
                }
                if (call.data.includes("refresh")) {
                    delete schedule_cache[groupId]
                    call.data = call.data.replace('refresh', '')
                }
                try {
                    await ScheduleController.getScheduleMenu(call)
                } catch (e) {
                    console.error(e)
                    log.error("ОШИБКА В КОЛБЕК ХЕНДЕЛЕРЕ schedule", {userId: call.message.chat.id, stack: e.stack})
                }

            }

            if (call.data.includes("profile|")) {
                try {
                    const [, _id] = call.data.split("|")
                    await ProfileController.getProfile(call, _id)
                } catch (e) {
                    console.error(e)
                    log.error("ВАЖНО! ОШИБКА В PROFILE КОЛБЕК ХЕНДЛЕРЕ!", {
                        userId: call.message.chat.id,
                        stack: e.stack
                    })
                }
            }

            if (call.data.includes("department|")) {
                try {
                    const [, page] = call.data.split('|');
                    if (isNaN(parseFloat(page))) {
                        return await queryValidationErrorController(call)
                    }
                    await TeacherScheduleController.getDepartmentMenu(call.message, +page)
                } catch (e) {
                    return await unexpectedErrorController(e, call.message, call.data)
                }
            }

            if (call.data.includes("teacher|")) {
                try {
                    const [, departmentId, page] = call.data.split('|');
                    if (isNaN(parseFloat(page))) {
                        return await queryValidationErrorController(call)
                    }
                    await TeacherScheduleController.getTeacherMenu(call.message, departmentId, +page)
                } catch (e) {
                    return await unexpectedErrorController(e, call.message, call.data)
                }
            }

            if (call.data.includes("TeacherSchedule|")) {
                const [, teacherId,] = call.data.split("|")
                if (!teacherId) {
                    return await queryValidationErrorController(call)
                }
                if (call.data.includes("refresh")) {
                    delete schedule_cache[teacherId]
                    call.data = call.data.replace('refresh', '')
                }
                try {
                    await TeacherScheduleController.getScheduleMenu(call)
                } catch (e) {
                    console.error(e)
                    log.error("ОШИБКА В КОЛБЕК ХЕНДЕЛЕРЕ teacherSchedule", {
                        userId: call.message.chat.id,
                        stack: e.stack
                    })
                }

            }
            if (call.data.includes("searchGroup|")) {
                try {
                    const [, groupName, page] = call.data.split("|")

                    await SearchGroupController.getSearchGroupMenu(call.message, groupName, +page)
                } catch (e) {
                    return await unexpectedErrorController(e, call.message, call.data)
                }
            }

            if (call.data.includes("searchTeacher|")) {
                try {
                    const [, teacher, page] = call.data.split("|")

                    await SearchTeacherController.getSearchTeacherMenu(call.message, teacher, +page)
                } catch (e) {
                    return await unexpectedErrorController(e, call.message, call.data)
                }
            }

            await bot.answerCallbackQuery(call.id).catch(e => log.info("Ошибка с ответов на колбек" + e.message))
        })

    })
}
