import profileService from "../services/profileService.js";
import log from "../logging/logging.js";

class ProfileController {
    async findProfiles(bot, message, surname) {
        try {
            const teachers = await profileService.findByName(surname)
            if (!teachers.length) {
                await bot.editMessageText(`⚠️ К сожалению по запросу: <b>${surname}</b> ничего не найдено.\n` + `✍️ Проверьте корректность ввода.\n` + `Если всё в порядке и я не могу найти - значит сори 🙃`, {
                    message_id: message.message_id, chat_id: message.chat.id, parse_mode: 'HTML'
                })
            } else {

                let markup = {
                    inline_keyboard: teachers.map((teacher) => [{
                        text: teacher.name, callback_data: `profile|${teacher._id}`
                    }])
                }

                await bot.editMessageText(`✅По вашему запросу: <b>${surname}</b> найдено ${teachers.length} профилей!🙉`, {
                    message_id: message.message_id, chat_id: message.chat.id, parse_mode: 'HTML', reply_markup: markup
                })

            }
        } catch (e) {
            log.error(`User ${message.chat.id} get an error when was trying to get a teacher's profile`, {
                stack: e.stack, message
            });
            await bot.editMessageText('⚠️ Я не знаю что произошло, но по какой-то никому не известной причине произошла ошибочка. Не переживай, фиксики уже в пути. Прости(', {
                chat_id: message.chat.id, message_id: message.message_id
            });
        }

    }

    async getProfile(bot, call, _id) {
        try {
            const teacher = await profileService.getById(_id)

            await bot.sendDocument(call.message.chat.id, teacher.href, {
                caption: `👩‍🚀: ${teacher.name}\n🌏: ${teacher.faculty}\n🚀: ${teacher.department}`
            })
                .catch(async (e) => {
                    await bot.sendMessage(call.message.chat.id, `⚠️ Произошла ошибка при отправке документа. Скорее всего он недоступен. Вот ссылочка на него:\n${teacher.href}`)
                    log.warn(`Произошла ошибка при попытке отправить профиль. Чел не пострадал, получил ссылочку. Ошибка: ${e.message}`, {stack:e.stack})
                })

            await bot.deleteMessage(call.message.chat.id, call.message.message_id)
        } catch (e) {
            log.error(`User ${call.message.chat.id} got an error when was clicking to the teacher profile`, {
                stack: e.stack, call
            })
            await bot.editMessageText('⚠️ Произошла какая-то непредвиденная ошибочка. Фиксики уже в пути. Попробуйте снова!', {
                chat_id: call.message.chat.id, message_id: call.message.message_id, reply_markup: {
                    inline_keyboard: [[{text: "Попробовать снова", callback_data: call.data}]]
                }
            })
        }

    }
}

export default new ProfileController()