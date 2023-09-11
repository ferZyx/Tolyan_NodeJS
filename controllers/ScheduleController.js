import log from "../logging/logging.js"
import facultyService from "../services/facultyService.js"
import programService from "../services/programService.js"
import groupService from "../services/groupService.js";
import axios from "axios";
import scheduleService from "../services/scheduleService.js";
import userService from "../services/userService.js";
import {startCommandController} from "./commands/startCommandController.js";
import {unexpectedCommandController} from "../exceptions/bot/unexpectedCommandController.js";

export let schedule_cache = {}

class ScheduleController {
    getRowMarkup(data, refTo) {
        return {
            inline_keyboard: data.map((item) => [{
                text: item.name, callback_data: `${refTo}|${item.id}|0`
            }])
        }
    }

    configureMenuData(data, page) {
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

    formatElapsedTime(timestamp) {
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

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
    }

    async getCurrentDayNumber() {
        const currentDate = new Date();
        if (currentDate.getHours() >= 18) {
            return ((currentDate.getDay() + 6) % 7) + 1;
        }
        return (currentDate.getDay() + 6) % 7;
    }

    async getFacultyMenu(bot, message, prePage) {
        try {
            const faculties = await facultyService.getAll()

            const {data, page, page_count} = this.configureMenuData(faculties, prePage)

            let markup = this.getRowMarkup(data, 'program')

            if (page_count > 0) {
                markup.inline_keyboard.push([{text: '⬅️', callback_data: `faculty|${page - 1}`}, {
                    text: '➡️', callback_data: `faculty|${page + 1}`
                }])
            }

            await bot.editMessageText(`📌 Выбор факультета. \n📄 Страница: ${Number(page) + 1} из ${page_count + 1}`, {
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

            const {data, page, page_count} = this.configureMenuData(programs, prePage)

            let markup = this.getRowMarkup(data, `group|${facultyId}`)

            if (page_count > 0) {
                markup.inline_keyboard.push([{text: '⬅️', callback_data: `program|${facultyId}|${page - 1}`}, {
                    text: '➡️', callback_data: `program|${facultyId}|${page + 1}`
                }])
            }

            markup.inline_keyboard.push([{text: 'Вернуться назад', callback_data: `faculty|0`}])

            await bot.editMessageText(`📌 Выбор образовательной программы. \n🏛️ Факультет: ${faculty.name}\n📄 Страница: ${Number(page) + 1} из ${page_count + 1}`, {
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

            const {data, page, page_count} = this.configureMenuData(groups, prePage)

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

            await bot.editMessageText(`📌 Выбор группы. \n📘 Образовательная программа: ${program.name}\n📄 Страница: ${Number(page) + 1} из ${page_count + 1}`, {
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

        const scheduleLifeTime = this.formatElapsedTime(timestamp)
        const scheduleDateTime = this.formatTimestamp(timestamp)

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
        let end_text = `🔥 МЕНЯ ОБНОВИЛИ! 🔥/news\n🕰 <i><b>Расписание загружено: 👇\n${scheduleLifeTime} назад || ${scheduleDateTime}   👈</b></i>\n` +
            '📖 Помощь: /help\n' +
            '🗞 Наш канал: https://t.me/ksutolyan \n' +
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
        await bot.editMessageText(msg_text,
            {
                message_id: call.message.message_id,
                chat_id: call.message.chat.id,
                parse_mode: "HTML",
                reply_markup: markup,
                disable_web_page_preview: true
            })
    }

    async getReservedSchedule(bot, call, groupId) {
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
    }

    async getScheduleMenu(bot, call) {
        try {
            const data_array = call.data.split('|');
            let [, language, groupId] = data_array

            if (groupId in schedule_cache && Date.now() - schedule_cache[groupId].timestamp <= 30 * 60 * 1000) {
                await this.sendSchedule(bot, call, schedule_cache[groupId])
            } else {
                await axios.get(`https://api.tolyan.me/schedule/get_schedule_by_groupId/${groupId}/${language}`, {
                    timeout: 10000
                })
                    .then(async (response) => {
                        const group = await groupService.getById(groupId)
                        schedule_cache[groupId] = {data: response.data, timestamp: Date.now(), group}
                        await this.sendSchedule(bot, call, schedule_cache[groupId])

                        await scheduleService.updateByGroupId(groupId, response.data).catch(e => log.error(`Ошибка при попытке сохранить резервную копию расписания в бд. groupId:${groupId}. Пользователь никак не пострадал.`, {
                            stack: e.stack, call, userId: call.message.chat.id
                        }))
                    })
                    .catch(async (e) => {
                        try {
                            log.info(`User ${call.message.chat.id} gets a cached schedule.`, {
                                e,
                                userId: call.message.chat.id
                            })
                            await this.getReservedSchedule(bot, call, groupId)
                        } catch (e) {
                            log.error("Ошбика при получении резервного расписания.", {
                                stack: e.stack,
                                call,
                                userId: call.message.chat.id
                            })
                            return await unexpectedCommandController(e, bot, call.message, call.data)
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
                group: groupId,
                scheduleType:"student"
            }).catch((e) => log.error("Ошибка при обновлении данных о пользователе при получении расписания. ", {
                stack: e.stack, call, userId: call.message.chat.id
            }))

        } catch (e) {
            return await unexpectedCommandController(e, bot, call.message, call.data)
        }

    }

    async getSchedule(bot, msg) {
        const answer = await bot.sendMessage(msg.chat.id, "🪄 Пытаюсь накодовать твое расписание. Вжух!", {parse_mode: 'HTML'})
        try {
            const User = await userService.getUserById(msg.chat.id)
            if (!User) {
                await bot.deleteMessage(msg.chat.id, answer.message_id);
                return await startCommandController(bot, msg);
            }

            const groupId = User.group
            if (!groupId) {
                await bot.deleteMessage(msg.chat.id, answer.message_id);
                return await startCommandController(bot, msg);
            }
            const Group = await groupService.getById(groupId)
            if (!Group) {
                log.error(`!!! USER ${msg.chat.id} УЧИТСЯ В ГРУППЕ КОТОРОЙ НЕТ В БД.`, {User, userId: msg.chat.id})
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
            log.error(`Ошибка при получении расписания через /schedule: ` + e.message)
            await bot.editMessageText("⚠️ Произошла непредвиденная ошибочка. Попробуйте /start. Возможно я сломался и меня скоро починят.", {
                chat_id: answer.chat.id, message_id: answer.message_id
            })
        }

    }
}

export default new ScheduleController()