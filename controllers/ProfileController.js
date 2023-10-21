import profileService from "../services/profileService.js";
import log from "../logging/logging.js";
import {bot} from "../app.js";
import userService from "../services/userService.js";
import i18next from "i18next";
import {criticalErrorController} from "../exceptions/bot/criticalErrorController.js";


class ProfileController {
    async findProfiles(msg, surname) {
        try {
            const user_language = await userService.getUserLanguage(msg.chat.id)

            const teachers = await profileService.findByName(surname)
            if (!teachers.length) {
                const msg_text = i18next.t('search_bad_result', {lng:user_language, searchQuery:surname})

                await bot.sendMessage(msg.chat.id, msg_text, {parse_mode:"HTML"})
            } else {

                let markup = {
                    inline_keyboard: teachers.map((teacher) => [{
                        text: teacher.name, callback_data: `profile|${teacher._id}`
                    }])
                }

                const msg_text = i18next.t('profile_search_result', {lng:user_language, searchQuery:surname, searchCountResult:teachers.length})

                await bot.sendMessage(msg.chat.id, msg_text, {reply_markup: markup, parse_mode:"HTML"})
            }
        } catch (e) {
            log.error(`User ${msg.chat.id} get an error when was trying to get a teacher's profile`, {
                stack: e.stack, msg
            });
            await criticalErrorController(msg)
        }

    }

    async getProfile(call, _id) {
        try {
            const user_language = await userService.getUserLanguage(call.message.chat.id)
            const teacher = await profileService.getById(_id)

            await bot.sendDocument(call.message.chat.id, teacher.href, {
                caption: `👩‍🚀: ${teacher.name}\n🌏: ${teacher.faculty}\n🚀: ${teacher.department}`
            })
                .catch(async (e) => {
                    const msg_text = i18next.t('sending_document_error', {lng:user_language, link:teacher.href})
                    await bot.sendMessage(call.message.chat.id, msg_text)
                    log.warn(`Произошла ошибка при попытке отправить профиль. Чел не пострадал, получил ссылочку. Ошибка: ${e.message}`, {stack: e.stack})
                })

            await bot.deleteMessage(call.message.chat.id, call.message.message_id)
        } catch (e) {
            log.error(`User ${call.message.chat.id} got an error when was clicking to the teacher profile`, {
                stack: e.stack, call
            })
            await criticalErrorController(msg)
        }

    }
}

export default new ProfileController()