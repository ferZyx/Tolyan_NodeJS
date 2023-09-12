import axios from "axios";
import facultyService from "../services/facultyService.js";
import log from "../logging/logging.js";
import programService from "../services/programService.js";
import groupService from "../services/groupService.js";
import userService from "../services/userService.js";
import ScheduleController from "../controllers/ScheduleController.js";
import fs from "fs/promises"
import UserActivityService from "../services/userActivityService.js";
import userActivityService from "../services/userActivityService.js";
import userRegistrationStatService from "../services/userRegistrationStatService.js";
import departmentService from "../services/departmentService.js";
import teacherService from "../services/teacherService.js";
import teacherProfileService from "../services/teacherProfileService.js";
import {isAdminMiddleware} from "../middlewares/bot/isAdminMiddleware.js";
import {updateFacultiesCommandController} from "../controllers/commands/adminCommands/updateFaculties.js";
import {updateProgramsCommandController} from "../controllers/commands/adminCommands/updatePrograms.js";
import {updateGroupsCommandController} from "../controllers/commands/adminCommands/updateGroups.js";

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export default function setupAdminCommandHandler(bot) {
    bot.onText(/^\/update_faculties$/, async (msg) => {
        await isAdminMiddleware(bot, msg, async() => {
            await updateFacultiesCommandController()
        })
    })

    bot.onText(/^\/update_programs$/, async (msg) => {
        await isAdminMiddleware(bot, msg, async () => {
            await updateProgramsCommandController()
        })
    })

    bot.onText(/^\/update_groups$/, async (msg) => {
        await isAdminMiddleware(bot, msg, async() => {
            await updateGroupsCommandController()
        })
    })

    bot.onText(/^\/update_profiles$/, async (msg) => {
        if (!await userService.isAdmin(msg.from.id)) {
            return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
        }
        try{
            const old_teachers = await teacherService.getAll()

            await bot.sendMessage(msg.chat.id, 'Начинаю получать преподов!')

            await axios.get(`https://api.tolyan.me/teacher/get_all_teachers`, {timeout: 60 * 1000})
                .then(async(response) => {
                    const teachers = response.data
                    await teacherProfileService.updateAll(teachers)

                    await bot.sendMessage(msg.chat.id, "TeacherProfile list successfully updated! Congratulations!\n" +
                        `Было: ${old_teachers.length} || Стало: ${teachers.length} || Разница: ${teachers.length - old_teachers.length}`)
                })
        }catch (e) {
            await bot.sendMessage(msg.chat.id, "Error while teacher updating!")
            log.error("Ошибка при обновлении тичеров!")
            console.error(e)
        }
    })

    bot.onText(/^\/update_departments$/, async (msg) => {
        if (!await userService.isAdmin(msg.from.id)) {
            return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
        }
        await bot.sendMessage(msg.chat.id, 'Начинаю парсить departments, ИУ!')
        try {
            const old_departments = await departmentService.getAll()

            await axios.get("https://api.tolyan.me/teacherSchedule/get_departments_list")
                .then(async (response) => {
                    if (response.status) {
                        const departments = response.data

                        await departmentService.updateAll(departments)

                        await bot.sendMessage(msg.chat.id, "departments list successfully updated! Congratulations!\n" +
                            `Было: ${old_departments.length} || Стало: ${departments.length} || Разница: ${departments.length - old_departments.length}`)
                    } else {
                        await bot.sendMessage(msg.chat.id, `Received ${response.status} status code.`)
                    }
                })
                .catch((e) => {
                    if (e.response) {
                        bot.sendMessage(msg.chat.id, `Получен ${e.response.status} status code. Данные в бд не троагал.`)
                    } else {
                        log.error('Ошибка при парсинге departments')
                    }
                })
        } catch (e) {
            log.error(`ADMIN ERROR WHILE FACULTY LIST UPDATING`, {stack: e.stack})
            await bot.sendMessage(msg.chat.id, 'Произошла ошибка при парсинге факультетов')
        }
    })

    bot.onText(/^\/update_teachers$/, async (msg) => {
        if (!await userService.isAdmin(msg.from.id)) {
            return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
        }
        await bot.sendMessage(msg.chat.id, "Teachers list updating is starting!")
        const startTime = Date.now()

        let teachers = []
        let isErrorless = true
        const old_teachers = await teacherService.getAll()
        await departmentService.getAll()
            .then(async (departments) => {
                for (const department of departments) {
                    const teachers_list = await get_teachers_list(department.id)
                    for (const teacher of teachers_list) {
                        teachers.push({
                            name: teacher['name'],
                            id: teacher['id'],
                            href: teacher['href'],
                            department: teacher['departmentId'],
                        })
                    }

                    const stage = Math.floor(departments.indexOf(department) / departments.length * 100)
                    await bot.sendMessage(msg.chat.id, `${department.name} || It is ${stage}%.`)
                    await sleep(3000)
                }
            })
            .catch((e) => {
                isErrorless = false
                log.error("Ошибка при получении списка departments при обновлении teachers_list.", {stack: e.stack})
            })
        if (isErrorless) {
            await teacherService.updateAll(teachers)
            const endTime = Date.now()
            await bot.sendMessage(msg.chat.id, `Teachers updating finished successfully. Action time: ` +
                `${Math.floor((endTime - startTime) / 1000)} сек.` +
                `Было: ${old_teachers.length} || Стало: ${teachers.length} || Разница: ${teachers.length - old_teachers.length}`)

        } else {
            await bot.sendMessage(msg.chat.id, "Error while teacher updating( check logs!")
        }

        async function get_teachers_list(departmentId) {
            try {
                const response = await axios.get(`https://api.tolyan.me/teacherSchedule/get_teachers_list/${departmentId}`)
                return response.data
            } catch (e) {
                log.error("Произошла ошибка при обновлении department. Через 5 минут попробую продолжить")
                await sleep(5 * 60 * 1000)
                return get_teachers_list(departmentId)
            }

        }
    })


    bot.onText(/^\/info$/, async (msg) => {
        if (!await userService.isAdmin(msg.from.id)) {
            return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
        }
        log.warn("Тестовый лог!")
        await bot.sendMessage(msg.chat.id, JSON.stringify(msg, null, 2))
    })

    bot.onText(/^\/test$/, async (msg) => {
        if (!await userService.isAdmin(msg.from.id)) {
            return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
        }
        try {
            log.info("info")
            log.warn('warn')
        } catch (e) {
            log.error("Ошибочка в /test", {stack: e.stack})
        }
    })

    bot.onText(/\/stat/, async (msg) => {
        if (!await userService.isAdmin(msg.from.id)) {
            return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
        }
        try {
            // Юзеров за сегодня
            const activeUsersToday = await userActivityService.getTodayUserCount()
            const registeredUsersToday = await userRegistrationStatService.getTodayRegisteredUserCount()

            let msg_text = 'Статистика ежедневного онлайна: \n' +
                `Сегодня: ${activeUsersToday}\n`
            const {weakUserActivity, weakUserCount} = await UserActivityService.getWeakUserActivity()
            for (const doc of weakUserActivity) {
                const date = new Date(doc.createdAt); // Преобразуем строку в объект Date
                const day = date.getDate().toString().padStart(2, '0'); // Извлекаем день и форматируем
                const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Извлекаем месяц и форматируем

                msg_text += `${day}.${month}: ${doc.userActivity}\n`
            }
            msg_text += `Всего уникальных пользователей за неделю: ${weakUserCount}\n\n`

            msg_text += 'Статистика ежедневных регистраций: \n' +
                `Сегодня: ${registeredUsersToday}\n`
            const {
                weakRegisteredUserCount,
                weakRegistrationStat
            } = await userRegistrationStatService.getWeakRegistrationStat()
            for (const doc of weakRegistrationStat) {
                const date = new Date(doc.createdAt); // Преобразуем строку в объект Date
                const day = date.getDate().toString().padStart(2, '0'); // Извлекаем день и форматируем
                const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Извлекаем месяц и форматируем

                msg_text += `${day}.${month}: ${doc.registeredUsers}\n`
            }
            msg_text += `Всего зареганных пользователей за неделю: ${weakRegisteredUserCount}`

            await bot.sendMessage(msg.chat.id, msg_text)
        } catch (e) {
            log.error("Ошибочка в /stat", {stack: e.stack})
        }
    })

    bot.onText(/^\/users$/, async (msg) => {
        try {
            if (!await userService.isAdmin(msg.from.id)) {
                return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
            }
            const userCount = await userService.countDocuments()
            await bot.sendMessage(msg.chat.id, `В базе данных Толяна ${userCount} пользователей.`)
        } catch (e) {
            log.error({stack: e.stack})
        }
    })

    bot.onText(/^\/group_stat$/, async (msg) => {
        try {
            if (!await userService.isAdmin(msg.from.id)) {
                return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
            }
            await bot.sendMessage(msg.chat.id, "started")
            const startTime = Date.now()

            let group_stat = []

            const groups = await groupService.getAll()
            const users = await userService.getAll()

            for (const group of groups) {
                const our_users = users.filter(user => user.group === group.id)
                group_stat.push({
                    id: group.id,
                    name: group.name,
                    students: group.studentCount,
                    our_users: our_users.length,
                    not_our_users: group.studentCount - our_users.length,
                    ratio: our_users.length / group.studentCount
                })
            }

            const sortedGroupStat = group_stat.slice().sort((a, b) => b.not_our_users - a.not_our_users);

            const activeGroups = sortedGroupStat.filter(group => group.ratio > 0).slice(0, 20)

            let msg_text = 'Потенциальные юзеры: \n'
            for (const group of activeGroups){
                msg_text += `ID: ${group.id}, All: ${group.students} | Не наши: ${group.not_our_users}\n` +
                    `/get_users_by_group${group.id}\n`
            }

            await fs.writeFile("./temp/group_stat.json", JSON.stringify(sortedGroupStat, null, 3))
            const endTime = Date.now()
            await bot.sendDocument(msg.chat.id, './temp/group_stat.json', {caption: `Action time: ${(endTime - startTime) / 1000} сек.\n}`})
            await bot.sendMessage(msg.chat.id, msg_text)
        } catch (e) {
            console.log(e)
            log.error("error", {stack: e.stack})
        }
    })

    bot.onText(/^\/get_schedule (\w+)$/i, async (msg, match) => {
        try {
            if (!await userService.isAdmin(msg.from.id)) {
                return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
            }
            const groupId = match[1];

            const answer = await bot.sendMessage(msg.chat.id, `Получаем расписание группы: ${groupId}`)
            const Group = await groupService.getById(groupId)
            if (!Group) {
                return bot.editMessageText("Нет такой группы. ", {
                    chat_id: answer.chat.id, message_id: answer.message_id
                })
            }

            const call = {
                data: `schedule|${Group.language}|${groupId}|${await ScheduleController.getCurrentDayNumber()}`,
                message: answer
            }
            await ScheduleController.getScheduleMenu(bot, call)
        } catch (e) {
            log.error({stack: e.stack})
        }

    });

    bot.onText(/^\/get_reserved_schedule (\w+)$/i, async (msg, match) => {
        try {
            if (!await userService.isAdmin(msg.from.id)) {
                return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
            }
            const groupId = match[1];

            const answer = await bot.sendMessage(msg.chat.id, `Получаем расписание группы: ${groupId}`)
            const Group = await groupService.getById(groupId)
            if (!Group) {
                return bot.editMessageText("Нет такой группы. ", {
                    chat_id: answer.chat.id, message_id: answer.message_id
                })
            }

            const call = {
                data: `schedule|${Group.language}|${groupId}|${await ScheduleController.getCurrentDayNumber()}`,
                message: answer
            }
            await ScheduleController.getReservedSchedule(bot, call, groupId)
        } catch (e) {
            log.error({stack: e.stack})
        }

    });

    bot.onText(/^\/get_user/i, async (msg) => {
        try {
            if (!await userService.isAdmin(msg.from.id)) {
                return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
            }
            const userId = parseFloat(msg.text.replace('/get_user', ''))
            if (isNaN(userId)) {
                return await bot.sendMessage(msg.chat.id, "UserId is NaN")
            }

            const user = await userService.getUserById(userId)
            if (!user) {
                return await bot.sendMessage(msg.chat.id, "Не найден такой юзер. НЕТУ!")
            }
            let msg_text = `Информация о юзере id: ${userId}\n` +
                `Тип: ${user.userType}\n` +
                `username: ${user.username}\n`

            if (user.userType !== 'private'){
                msg_text += `Название: ${user.userTitle}\n\n`
            }else{
                msg_text += `Имя: ${user.firstName}\n` +
                    `Фамилия: ${user.lastName}\n`
            }
            msg_text += `Тип расписания: ${user.scheduleType}\n`

            const group = await groupService.getById(user.group)
            if (group) {
                const group_users = await userService.getUsersCountByGroupId(group.id)
                msg_text += `\nГруппа: ${group.name} | id: ${group.id}\n` +
                    `В группе: ${group.studentCount} | Пользуются ботом: ${group_users}\n`
                const program = await programService.getById(group.program)
                const faculty = await facultyService.getById(program.faculty)

                msg_text += `Программа: ${program.name} || id: ${program.id}\n`
                msg_text += `Факультет: ${faculty.name} || id: ${faculty.id}\n`
            }
            const teacher = await teacherService.getById(user.teacher)
            if (teacher) {
                msg_text += `\nПрепод: ${teacher.name} | id: ${teacher.id}\n`
            }
            msg_text += `last_activity: ${ScheduleController.formatElapsedTime((new Date(user.updatedAt).getTime()))} назад\n`


            await bot.sendMessage(msg.chat.id, msg_text)
        } catch (e) {
            log.error("Ошибочка при /get_user", {stack: e.stack})
        }

    });

    bot.onText(/^\/get_users_by_group/i, async (msg) => {
        try {
            if (!await userService.isAdmin(msg.from.id)) {
                return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
            }
            const groupId = parseFloat(msg.text.replace('/get_users_by_group', ''))
            if (isNaN(groupId)) {
                return await bot.sendMessage(msg.chat.id, "UserId is NaN")
            }

            const users = await userService.getUsersByGroupId(groupId)

            let msg_text = `Group ${groupId} users: \n`
            for (const user of users){
                msg_text += `/get_user${user.userId}\n`
            }

            await bot.sendMessage(msg.chat.id, msg_text)
        } catch (e) {
            log.error("Ошибочка при /get_users_by_group", {stack: e.stack})
        }

    });


    bot.onText(/^\/get_logs/i, async (msg) => {
        try {
            if (!await userService.isAdmin(msg.from.id)) {
                return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
            }

            await bot.sendDocument(msg.chat.id, './logs.log')
        } catch (e) {
            log.error("Ошибочка при /get_logs", {stack: e.stack})
        }

    });

    bot.onText(/^\/sms/i, async (msg) => {
        try {
            if (!await userService.isAdmin(msg.from.id)) {
                return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
            }
            const split_data = msg.text.split(" ")
            if (split_data.length < 3) {
                return await bot.sendMessage(msg.chat.id, "После команды должен быть 2 параметра!")
            }
            const userId = split_data[1]
            if (isNaN(parseFloat(userId))) {
                return await bot.sendMessage(msg.chat.id, "Параметр userId is NaN")
            }
            const msg_text = msg.text.replace(userId, '').replace('/sms ', '')

            await bot.sendMessage(userId, msg_text)
            await bot.sendMessage(msg.chat.id, "Отправлено: \n" + msg_text)
        } catch (e) {
            log.error("Ошибочка при /sms", {stack: e.stack})
        }

    });

    bot.onText(/^\/unactive_spam/i, async (msg) => {
        try {
            if (!await userService.isAdmin(msg.from.id)) {
                return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
            }
            const split_data = msg.text.split(" ")
            if (split_data.length < 2) {
                return await bot.sendMessage(msg.chat.id, "После команды должен быть текст!")
            }
            const msg_text = msg.text.replace("/unactive_spam", "")

            const users = await userActivityService.getUnactiveUsers()
            let success = []
            let bad = []

            await bot.sendMessage(msg.chat.id, 'Начал спамить.\n\n' + msg_text)
            const startTime = Date.now()

            for (const user of users) {
                await sleep(500)
                try {
                    await bot.sendMessage(user.userId, msg_text)
                    log.info(`User ${user.userId} получил unactive_spam message`)
                    success.push(user.userId)
                } catch (e) {
                    log.info(`User ${user.userId} не получил спам сообщение.`, {stack: e.stack})
                    bad.push(user.userId)
                }
            }

            await fs.writeFile("./temp/success.json", JSON.stringify(success, null, 3))
            await fs.writeFile("./temp/bad.json", JSON.stringify(bad, null, 3))

            const endTime = Date.now()
            await bot.sendDocument(msg.chat.id, './temp/success.json', {caption: `Action time: ${(endTime - startTime) / 1000} сек.`})
            await bot.sendDocument(msg.chat.id, './temp/bad.json')

        } catch (e) {
            log.error("Ошибочка при /unactive_spam", {stack: e.stack})
        }

    });

    bot.onText(/^\/spam/i, async (msg) => {
        let stop = false
        bot.onText(/\/stop/, async (msg) => {
            await bot.sendMessage(msg.chat.id, "Остановил спамить")
            stop = true
        })
        try {
            if (!await userService.isAdmin(msg.from.id)) {
                return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
            }
            const split_data = msg.text.split(" ")
            if (split_data.length < 2) {
                return await bot.sendMessage(msg.chat.id, "После команды должен быть текст!")
            }
            const msg_text = msg.text.replace("/spam ", "")

            const users = await userService.getAll()

            await bot.sendMessage(msg.chat.id, 'Начал спамить. /stop чтобы принудительно завершить спам\n' + msg_text, {disable_web_page_preview: true})
            const startTime = Date.now()

            for (const user of users) {
                if (stop) {
                    break
                }
                await sleep(2000)
                let status = true
                try {
                    await bot.sendMessage(user.userId, msg_text, {disable_web_page_preview: true})
                    log.info(`User ${user.userId} получил spm message`)
                } catch (e) {
                    status = false
                    log.info(`User ${user.userId} не получил спам сообщение.`, {stack: e.stack})
                }
            }

            await bot.sendMessage(msg.chat.id, `Done. Action time = ${Math.floor((Date.now() - startTime) / 1000)}`)

        } catch (e) {
            log.error("Ошибочка при /spam", {stack: e.stack})
        }

    });

    bot.onText(/^\/get_group (\w+)/i, async (msg, match) => {
        try {
            if (!await userService.isAdmin(msg.from.id)) {
                return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
            }
            const groupId = match[1];

            const group = await groupService.getById(groupId)
            await bot.sendMessage(msg.chat.id, JSON.stringify(group, null, 4))
        } catch (e) {
            log.error({stack: e.stack})
        }

    });

    bot.onText(/^\/get_callback/i, async(msg) =>{
        try{
            if (!await userService.isAdmin(msg.from.id)) {
                return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
            }
            if (msg.text.split(" ") <2){
                return await bot.sendMessage(msg.chat.id, "После команды должно быть значение колбека")
            }
            const callback_data = msg.text.replace('/get_callback ', '')
            await bot.sendMessage(msg.chat.id, "here is your callback: " + callback_data, {
                reply_markup:{inline_keyboard:[[{text:callback_data, callback_data}]]}
            })
        }catch (e) {
            log.error({stack: e.stack})
        }
    })

    bot.onText(/^\/ahelp/i, async (msg) => {
        const msg_text = '/update_faculties \n' +
            '/update_programs \n' +
            '/update_groups \n' +
            '/update_teaches \n' +
            '/info \n' +
            '/test \n' +
            '/stat \n' +
            '/get_schedule \n' +
            '/get_reserved_schedule \n' +
            '/get_user \n' +
            '/get_logs \n' +
            '/sms \n' +
            '/unactive_spam \n' +
            '/spam \n' +
            '/stop \n' +
            '/get_group \n'
        await bot.sendMessage(msg.chat.id, msg_text)
    });

}