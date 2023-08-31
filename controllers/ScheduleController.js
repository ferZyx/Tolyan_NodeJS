import log from "../logging/logging.js"
import facultyService from "../services/facultyService.js"
import programService from "../services/programService.js"
import groupService from "../services/groupService.js";
import axios from "axios";
import scheduleService from "../services/scheduleService.js";
import userService from "../services/userService.js";

export let schedule_cache = {}


function getRowMarkup(data, refTo) {
    return {
        inline_keyboard: data.map((item) => [{
            text: item.name, callback_data: `${refTo}|${item.id}|0`
        }])
    }
}

function configureMenuData(data, page) {
    const row_per_page = 10
    const page_count = Math.floor(data.length / row_per_page)
    if (page > page_count) {
        page = 0
    }
    if (page < 0) {
        page = page_count
    }
    const start_index = row_per_page * page;

    return {
        data: data.slice(start_index, start_index + row_per_page), page, page_count
    }
}

function formatElapsedTime(timestamp) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);

    if (diffInSeconds < 60) {
        return `✅ ${diffInSeconds} сек`;
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `✅ ${minutes} мин`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `👎 ${hours} ч`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `👎 ${days} дн`;
    }
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы в JavaScript нумеруются с 0 до 11, поэтому добавляем 1
    const year = String(date.getFullYear()).slice(2); // Получаем последние две цифры года

    return `${hours}:${minutes}:${seconds} | ${day}.${month}.${year}`;
}

class ScheduleController {
    async getCurrentDayNumber() {
        const currentDate = new Date();
        if (currentDate.getHours() >= 18) {
            return ((currentDate.getDay() + 6) % 7) + 1;
        }
        return (currentDate.getDay() + 6) % 7;
    }

    async registerUser(msg) {
        try {
            const User = await userService.findUserById(msg.chat.id)
            if (!User) {
                await userService.createUser({
                    userId: msg.chat.id,
                    userType: String(msg.chat.type),
                    userTitle: msg.chat.title,
                    firstName: msg.chat.first_name,
                    lastName: msg.chat.last_name,
                    username: msg.chat.username,
                }).then(user => log.warn("Зарегистрирован новый пользователь!", {user}))
            }
        } catch (e) {
            log.error("Ошибка при попытке зарегестрировать пользователя", {stack: e.stack, msg})
        }
    }

    async startCommand(bot, msg) {
        const answer = await bot.sendMessage(msg.chat.id, "🪄 Пытаюсь накодовать список факультетов. Вжух!", {parse_mode: 'html'})
        try {
            await this.getFacultyMenu(bot, answer, 0)
        } catch (e) {
            await this.errorHandler(e, bot, answer, "faculty|0")
        } finally {
            await this.registerUser(msg)
        }
    }

    async getFacultyMenu(bot, message, prePage) {
        try {
            const faculties = await facultyService.getAll()

            const {data, page, page_count} = configureMenuData(faculties, prePage)

            let markup = getRowMarkup(data, 'program')

            if (page_count > 0) {
                markup.inline_keyboard.push([{text: '⬅️', callback_data: `faculty|${page - 1}`}, {
                    text: '➡️', callback_data: `faculty|${page + 1}`
                }])
            }

            await bot.editMessageText(`📄 Страница: ${Number(page) + 1} из ${page_count + 1}`, {
                chat_id: message.chat.id, message_id: message.message_id, reply_markup: markup
            })

        } catch (e) {
            throw e
        }

    }

    async getProgramMenu(bot, message, facultyId, prePage) {
        try {
            const programs = await programService.getByFacultyId(facultyId)
            const faculty = await facultyService.getById(facultyId)

            const {data, page, page_count} = configureMenuData(programs, prePage)

            let markup = getRowMarkup(data, `group|${facultyId}`)

            if (page_count > 0) {
                markup.inline_keyboard.push([{text: '⬅️', callback_data: `program|${facultyId}|${page - 1}`}, {
                    text: '➡️', callback_data: `program|${facultyId}|${page + 1}`
                }])
            }

            markup.inline_keyboard.push([{text: 'Вернуться назад', callback_data: `faculty|0`}])

            await bot.editMessageText(`🏛️ Факультет: ${faculty.name}\n📄 Страница: ${Number(page) + 1} из ${page_count + 1}`, {
                chat_id: message.chat.id, message_id: message.message_id, reply_markup: markup
            })
        } catch (e) {
            throw e
        }
    }

    async getGroupMenu(bot, message, programId, facultyId, prePage) {
        try {
            const groups = await groupService.getByProgramId(programId)
            const program = await programService.getById(programId)

            const {data, page, page_count} = configureMenuData(groups, prePage)

            const day = await this.getCurrentDayNumber()

            let markup = {
                inline_keyboard: data.map((item) => [{
                    text: item.name, callback_data: `schedule|${item.language}|${item.id}|${day}`
                }])
            }

            if (page_count > 0) {
                markup.inline_keyboard.push([{
                    text: '⬅️', callback_data: `group|${facultyId}|${programId}|${page - 1}`
                }, {text: '➡️', callback_data: `group|${facultyId}|${programId}|${page + 1}`}])
            }

            markup.inline_keyboard.push([{
                text: 'Вернуться назад', callback_data: `program|${facultyId}|0`
            }])

            await bot.editMessageText(`📘 Образовательная программа: ${program.name}\n📄 Страница: ${Number(page) + 1} из ${page_count + 1}`, {
                chat_id: message.chat.id, message_id: message.message_id, reply_markup: markup
            })
        } catch (e) {
            throw e
        }
    }

    async sendSchedule(bot, call, schedule_cache, preMessage = '') {
        const timestamp = schedule_cache.timestamp
        const data = schedule_cache.data
        const group = schedule_cache.group

        const data_array = call.data.split('|');
        let [, , , dayNumber] = data_array
        if (+dayNumber > 5) {
            dayNumber = 0
        }
        if (+dayNumber < 0) {
            dayNumber = 5
        }

        const scheduleLifeTime = formatElapsedTime(timestamp)
        const scheduleDateTime = formatTimestamp(timestamp)

        const schedule_day = data[dayNumber]['day']
        const schedule = data[dayNumber]['subjects']

        let schedule_text = ``
        if (!schedule.length) {
            schedule_text = "🥳 <b>ВЫХОДНОЙ!</b>\n"
        }
        for (const item of schedule) {
            schedule_text += '⌚️ ' + item.time + '\n'
            schedule_text += '📚 ' + item.subject + '\n'
        }
        let end_text = `🕰 <i><b>Расписание загружено: ${scheduleDateTime} || ${scheduleLifeTime} назад.</b></i>\n` +
            '📖 Дополнительная информация: /help\n' +
            '🗞 Наш канал: https://t.me/ksutolyan (прямо сейчас проходит опрос)\n' +
            '<tg-spoiler>Угостить компотом: /donate </tg-spoiler>'
        let msg_text = `${preMessage}👥 Группа: ${group.name} | Курс: ${group.age}\n📆 Расписание на <b>${schedule_day}</b>:\n` + schedule_text + end_text

        const preCallback = data_array.slice(0, -1).join("|")

        let markup = {
            inline_keyboard: [[{text: `⬅️`, callback_data: preCallback + `|${+dayNumber - 1}`}, {
                text: `🔄`,
                callback_data: 'refresh' + call.data
            }, {
                text: `➡️`, callback_data: preCallback + `|${+dayNumber + 1}`
            }],]
        }
        await bot.editMessageText(msg_text, {
            message_id: call.message.message_id,
            chat_id: call.message.chat.id,
            parse_mode: "html",
            reply_markup: markup,
            disable_web_page_preview: true
        })
    }

    async getScheduleMenu(bot, call) {
        try {
            const data_array = call.data.split('|');
            let [, language, groupId] = data_array

            if (groupId in schedule_cache && Date.now() - schedule_cache[groupId].timestamp <= 30 * 60 * 1000) {
                await this.sendSchedule(bot, call, schedule_cache[groupId])
            } else {
                await axios.get(`http://79.133.182.125:5000/api/schedule/get_schedule_by_groupId/${groupId}/${language}`, {
                    timeout: 10000
                })
                    .then(async (response) => {
                        const group = await groupService.getById(groupId)
                        schedule_cache[groupId] = {data: response.data, timestamp: Date.now(), group}
                        await this.sendSchedule(bot, call, schedule_cache[groupId])

                        await scheduleService.updateByGroupId(groupId, response.data).catch(e => log.error("Ошибка при попытке сохранить резервную копию расписания в бд", {
                            stack: e.stack, call
                        }))
                    })
                    .catch(async () => {
                        try {
                            log.info(`User ${call.message.chat.id} gets a cached schedule.`)
                            await bot.editMessageText('💀 schedule.ksu.kz не отвечает. Сейчас поищу твое расписание в своих недрах...', {
                                chat_id: call.message.chat.id, message_id: call.message.message_id
                            })
                            const response = await scheduleService.getByGroupId(groupId)
                            if (response) {
                                const updatedAt = new Date(response.updatedAt);
                                const timestamp = updatedAt.getTime();

                                const group = await groupService.getById(groupId)
                                schedule_cache[groupId] = {data: response.data, timestamp, group}
                                await this.sendSchedule(bot, call, schedule_cache[groupId], "<b>⚠️ schedule.ksu.kz не отвечает. \n" +
                                    "🫡 Последнее загруженное расписание:\n\n</b>")
                            } else {
                                await bot.editMessageText("🙈 Первопроходец от своей группы?\n" +
                                    "⚠️ Официальный сайт КарУ - упал, а резервного расписания для вашей группы я не могу найти( \n" +
                                    "🫢 P.S. После получения расписания в нашем боте, оно подгружается в базу данных.\n" +
                                    "А дальше уже дело за малым, при следующем таком падении официального сайта мы возьмем расписание из нашей базы)\n" +
                                    "😉 Загрузи расписание как только schedule.ksu.kz встанет на ноги и больше ты не увидишь это дурацкое сообщение!", {
                                    chat_id: call.message.chat.id, message_id: call.message.message_id, reply_markup: {
                                        inline_keyboard: [[{text: "Попробовать снова", callback_data: call.data}]]
                                    }
                                })
                            }
                        } catch (e) {
                            log.error("Ошбика при получении резервного расписания.", {stack: e.stack, call})
                            await this.errorHandler(e, bot, call.message, call.data)
                        }
                    })
            }
            await userService.updateUser(call.message.chat.id, {
                userId: call.message.chat.id,
                userType: String(call.message.chat.type),
                userTitle: call.message.chat.title,
                firstName: call.message.chat.first_name,
                lastName: call.message.chat.last_name,
                username: call.message.chat.username,
                group: groupId
            }).catch((e) => log.error("Ошибка при обновлении данных о пользователе при получении расписания. ", {
                stack: e.stack,
                call
            }))

        } catch (e) {
            await this.errorHandler(e, bot, call.message, call.data)
        }

    }

    async getSchedule(bot, msg) {
        const answer = await bot.sendMessage(msg.chat.id, "🪄 Пытаюсь накодовать твое расписание. Вжух!", {parse_mode: 'html'})
        try {
            const User = await userService.getUserById(msg.chat.id)
            if (!User) {
                await bot.deleteMessage(msg.chat.id, answer.message_id);
                return this.startCommand(bot, msg);
            }

            const groupId = User.group
            if (!groupId) {
                await bot.deleteMessage(msg.chat.id, answer.message_id);
                return this.startCommand(bot, msg);
            }
            const Group = await groupService.getById(groupId)
            if (!Group) {
                log.error(`!!! USER ${msg.chat.id} УЧИТСЯ В ГРУППЕ КОТОРОЙ НЕТ В БД.`, {User})
                return bot.editMessageText("⚠️ Я не смог найти группу в которой ты учишься(\n" +
                    "2 варианта. Либо я сломался что вероятнее всего. Либо произошла какая то ошибка. \n" +
                    "Попробуй воспользоваться /start для получения расписания", {
                    chat_id: answer.chat.id, message_id: answer.message_id
                })
            }
            const language = Group.language
            const day = await this.getCurrentDayNumber()

            const call = {
                data: `schedule|${language}|${groupId}|${day}`,
                message: answer
            }
            await this.getScheduleMenu(bot, call)
        } catch (e) {
            log.error(`Ошибка при получении расписания через /schedule: ` + e.message, {stack: e.stack, msg})
            await bot.editMessageText("⚠️ Произошла непредвиденная ошибочка. Попробуйте /start. Возможно я сломался и меня скоро починят.", {
                chat_id: answer.chat.id, message_id: answer.message_id
            })
        }

    }

    async errorHandler(e, bot, message, callback_data) {
        try {
            log.error(`User ${message.chat.id} got an error at ${callback_data}. Данные об ошибке в метаданных.`, {
                stack: e.stack, message, callback_data
            })
            await bot.editMessageText("⚠️ Дико извиняемся, произошла какая то ошибка." + "\n🔩 Не переживайте, я уже вызвал фиксиков! Постараемся всё починить как можно скорее!", {
                chat_id: message.chat.id, message_id: message.message_id, reply_markup: {
                    inline_keyboard: [[{text: "Попробовать снова", callback_data}]]
                }
            })
        } catch (e) {
            log.error("УЛЬТРА МЕГА ВАЖНО! ОШИБКА ПРИ ПОПЫТКЕ ОБРАБОТАТЬ ОШИБКУ! errorHandler",
                {stack: e.stack, message})
        }
    }

    async validateErrorHandler(bot, call) {
        try {
            log.error(`User ${call.message.chat.id} used an incorrect callback: ${call.data}. Данные об ошибке в метаданных. Ему сказано шоб /start писал!`, {
                call
            })
            await bot.editMessageText("⚠️ Произошла ошибка!\n" +
                "Вероятно вы использовали кнопки которые вам прислал бот до обновления.\n" +
                "Попробуйте прописать /start и пройти авторизацию повторно.\n" +
                "Если это не помогает - свяжитесь с нами через https://t.me/lena_nebot", {
                chat_id: call.message.chat.id, message_id: call.message.message_id
            })
        } catch (e) {
            log.error("УЛЬТРА МЕГА ВАЖНО! ОШИБКА ПРИ ПОПЫТКЕ ОБРАБОТАТЬ ОШИБКУ! validateErrorHandler",
                {stack: e.stack, call})
        }
    }
}

export default new ScheduleController()