import departmentService from "../services/departmentService.js";
import ScheduleController, {schedule_cache} from "./ScheduleController.js";
import teacherService from "../services/teacherService.js";
import axios from "axios";
import log from "../logging/logging.js";
import {unexpectedCommandController} from "../exceptions/bot/unexpectedCommandController.js";
import userService from "../services/userService.js";
import teacherScheduleService from "../services/teacherScheduleService.js";

class TeacherScheduleController {
    transformGroupString(inputString) {
        // Используем регулярное выражение для поиска всех вхождений "(X/Y)" в строке
        const regex = /\((\d+)\/(\d+)\)/g;

        // Используем метод replace с регулярным выражением для замены формата
        let resultString = inputString.replace(regex, '(Ауд. $1 | $2 корпус)');

        // Разбиваем результат на массив по скобкам
        const parts = resultString.split(') ');

        // Если есть более одной скобки, добавляем символ новой строки между ними
        if (parts.length > 1) {
            for (let i = 0; i < parts.length - 1; i++) {
                parts[i] += ')\n';
            }
            resultString = parts.join('');
        }

        // Убираем лишний символ новой строки в конце строки
        resultString = resultString.trim();

        return resultString;
    }

    addSymbolToEachLine(inputString, symbol) {
        // Разбиваем строку на массив по символу новой строки "\n"
        const lines = inputString.split('\n');

        // Добавляем указанный символ в начало каждой строки
        const linesWithSymbol = lines.map((line) => `${symbol} ${line}`);

        // Объединяем строки обратно в одну строку с символами новой строки "\n"
        const resultString = linesWithSymbol.join('\n');

        return resultString;
    }

    async getDepartmentMenu(bot, message, prePage) {
        try {
            const departments = await departmentService.getAll()

            const {data, page, page_count} = ScheduleController.configureMenuData(departments, prePage)

            let markup = ScheduleController.getRowMarkup(data, 'teacher')

            if (page_count > 0) {
                markup.inline_keyboard.push([{text: '⬅️', callback_data: `department|${page - 1}`}, {
                    text: '➡️', callback_data: `department|${page + 1}`
                }])
            }

            await bot.editMessageText(`📌 Выбор кафедры. \n💡 P.S кафедру можно узнать используя команду "профиль". Подробнее /help\n` +
                `📄 Страница: ${Number(page) + 1} из ${page_count + 1}`, {
                chat_id: message.chat.id, message_id: message.message_id, reply_markup: markup
            })

        } catch (e) {
            throw e
        }
    }

    async getTeacherMenu(bot, message, departmentId, prePage) {
        try {
            const teachers = await teacherService.getByDepartmentId(departmentId)
            const department = await departmentService.getById(departmentId)

            const {data, page, page_count} = ScheduleController.configureMenuData(teachers, prePage)

            const day = await ScheduleController.getCurrentDayNumber()

            let markup = {
                inline_keyboard: data.map((item) => [{
                    text: item.name, callback_data: `TeacherSchedule|${item.id}|${day}`
                }])
            }

            if (page_count > 0) {
                markup.inline_keyboard.push([{
                    text: '⬅️', callback_data: `teacher|${departmentId}|${page - 1}`
                }, {text: '➡️', callback_data: `teacher|${departmentId}|${page + 1}`}])
            }

            markup.inline_keyboard.push([{
                text: 'Вернуться назад', callback_data: `department|0`
            }])

            await bot.editMessageText(`📌 Выбор преподавателя.\n📘 Кафедра: ${department.name}\n📄 Страница: ${Number(page) + 1} из ${page_count + 1}`, {
                chat_id: message.chat.id, message_id: message.message_id, reply_markup: markup
            })
        } catch (e) {
            throw e
        }
    }

    async sendSchedule(bot, call, schedule_cache, preMessage = '') {
        const timestamp = schedule_cache.timestamp
        const data = schedule_cache.data
        const teacher = schedule_cache.teacher

        const data_array = call.data.split('|');
        let [, , dayNumber] = data_array
        if (+dayNumber > 5) {
            dayNumber = 0
        }
        if (+dayNumber < 0) {
            dayNumber = 5
        }

        const scheduleLifeTime = ScheduleController.formatElapsedTime(timestamp)
        const scheduleDateTime = ScheduleController.formatTimestamp(timestamp)

        const schedule_day = data[dayNumber]['day']
        const schedule = data[dayNumber]['groups']

        let schedule_text = ``
        if (!schedule.length) {
            schedule_text = "🥳 <b>ВЫХОДНОЙ!</b>\n"
        }
        for (const item of schedule) {
            schedule_text += '⌚️ ' + item.time + '\n'
            schedule_text += this.addSymbolToEachLine(this.transformGroupString(item.group), '📚') + '\n\n'
        }
        let end_text = `🕰 <i><b>Расписание загружено: 👇\n${scheduleLifeTime} назад || ${scheduleDateTime}   👈</b></i>\n` +
            '📖 Помощь: /help\n' +
            '🗞 Наш канал: https://t.me/ksutolyan \n' +
            '<tg-spoiler>Угостить компотом: /donate </tg-spoiler>'
        let msg_text = `${preMessage}👥 <u>${teacher.name}</u>\n📆 Расписание на <b>${schedule_day}</b>:\n` + schedule_text + end_text

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

    async getScheduleMenu(bot, call) {
        try {
            const data_array = call.data.split('|');
            let [, teacherId] = data_array

            if (teacherId in schedule_cache && Date.now() - schedule_cache[teacherId].timestamp <= 30 * 60 * 1000) {
                await this.sendSchedule(bot, call, schedule_cache[teacherId])
            } else {
                await axios.get(`https://api.tolyan.me/teacherSchedule/get_teacher_schedule/${teacherId}`, {
                    timeout: 10000
                })
                    .then(async (response) => {
                        const teacher = await teacherService.getById(teacherId)
                        schedule_cache[teacherId] = {data: response.data, timestamp: Date.now(), teacher}
                        await this.sendSchedule(bot, call, schedule_cache[teacherId])

                        await teacherScheduleService.updateByTeacherId(teacherId, response.data).catch(e => log.error(`Ошибка при попытке сохранить резервную копию teacher расписания в бд. teacherId:${teacherId}. Пользователь никак не пострадал.`, {
                            stack: e.stack, call, userId: call.message.chat.id
                        }))
                    })
                    .catch(async (e) => {
                        try {
                            log.info(`User ${call.message.chat.id} gets a cached Teacher schedule.`, {
                                e,
                                userId: call.message.chat.id
                            })
                            await this.getReservedSchedule(bot, call, teacherId)
                        } catch (e) {
                            log.error("Ошбика при получении резервного Teacher расписания.", {
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
                teacher: teacherId,
                scheduleType: 'teacher'
            }).catch((e) => log.error("Ошибка при обновлении данных о пользователе при получении Teacher расписания. ", {
                stack: e.stack, call, userId: call.message.chat.id
            }))

        } catch (e) {
            return await unexpectedCommandController(e, bot, call.message, call.data)
        }

    }

    async getReservedSchedule(bot, call, teacherId) {
        await bot.editMessageText('💀 schedule.ksu.kz не отвечает. Сейчас поищу твое расписание в своих недрах...', {
            chat_id: call.message.chat.id, message_id: call.message.message_id
        })
        const response = await teacherScheduleService.getByTeacherId(teacherId)
        if (response) {
            const updatedAt = new Date(response.updatedAt);
            const timestamp = updatedAt.getTime();

            const teacher = await teacherService.getById(teacherId)
            schedule_cache[teacherId] = {data: response.data, timestamp, teacher}
            await this.sendSchedule(bot, call, schedule_cache[teacherId], "<b>⚠️ schedule.ksu.kz не отвечает. \n" +
                "🫡 Последнее загруженное расписание:\n\n</b>")
        } else {
            await bot.editMessageText("⚠️ Официальный сайт КарУ - упал, а резервного расписания для данного преподавателя я не могу найти( \n" +
                "🫢 P.S. После получения расписания в нашем боте, оно записывается в базу данных.\n" +
                "А дальше уже дело за малым, при следующем таком падении официального сайта мы возьмем расписание из нашей базы)\n" +
                "😉 Загрузи расписание как только schedule.ksu.kz встанет на ноги и больше ты не увидишь это дурацкое сообщение!", {
                chat_id: call.message.chat.id, message_id: call.message.message_id, reply_markup: {
                    inline_keyboard: [[{text: "Попробовать снова", callback_data: call.data}]]
                }
            })
        }
    }


}

export default new TeacherScheduleController()