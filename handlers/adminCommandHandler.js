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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export default function setupAdminCommandHandler(bot) {
    bot.onText(/^\/update_faculties$/, async (msg) => {
        if (!await userService.isAdmin(msg.from.id)) {
            return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
        }
        await bot.sendMessage(msg.chat.id, 'Начинаю парсить факульеты, ИУ!')
        try {
            const old_faculties = await facultyService.getAll()

            await axios.get("http://79.133.182.125:5000/api/schedule/get_faculty_list")
                .then(async (response) => {
                    if (response.status) {
                        const faculties = response.data

                        await facultyService.updateAll(faculties)

                        await bot.sendMessage(msg.chat.id, "Faculty list successfully updated! Congratulations!\n" +
                            `Было: ${old_faculties.length} || Стало: ${faculties.length} || Разница: ${faculties.length - old_faculties.length}`)
                    } else {
                        await bot.sendMessage(msg.chat.id, `Received ${response.status} status code.`)
                    }
                })
                .catch((e) => {
                    if (e.response) {
                        bot.sendMessage(msg.chat.id, `Получен ${e.response.status} status code. Данные в бд не троагал.`)
                    } else {
                        log.error('Ошибка при парсинге факультетов')
                    }
                })
        } catch (e) {
            log.error(`ADMIN ERROR WHILE FACULTY LIST UPDATING`, {stack: e.stack})
            await bot.sendMessage(msg.chat.id, 'Произошла ошибка при парсинге факультетов')
        }
    })

    bot.onText(/^\/update_programs$/, async (msg) => {
        if (!await userService.isAdmin(msg.from.id)) {
            return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
        }
        await bot.sendMessage(msg.chat.id, "The program list updating is starting!")
        const startTime = Date.now()

        let programs = []
        let isErrorless = true
        const old_programs = await programService.getAll()
        await facultyService.getAll()
            .then(async (faculties) => {
                for (const faculty of faculties) {
                    try {
                        const response = await axios.get(`http://79.133.182.125:5000/api/schedule/get_program_list_by_facultyId/${faculty.id}`)
                        const program_list = response.data

                        for (const program of program_list) {
                            programs.push({
                                name: program['name'],
                                id: program['id'],
                                href: program['href'],
                                faculty: program['facultyId'],
                            })
                        }
                    } catch (e) {
                        log.error("Ошибка при получении списка программ при обновлении.", {stack: e.stack})
                        isErrorless = false
                        break
                    }
                    const stage = Math.floor(faculties.indexOf(faculty) / faculties.length * 100)
                    await bot.sendMessage(msg.chat.id, `${faculty.name} || It is ${stage}%.`)
                    await sleep(2000)
                }
            })
            .catch((e) => {
                isErrorless = false
                log.error("Ошибка при получении списка факультетов при обновлении списка программ.", {stack: e.stack})
            })
        if (isErrorless) {
            await programService.updateAll(programs)
            const endTime = Date.now()
            await bot.sendMessage(msg.chat.id, `Program updating finished successfully. Action time:` +
                `${Math.floor((endTime - startTime) / 1000)} сек.\n` +
                `Было: ${old_programs.length} || Стало: ${programs.length} || Разница: ${programs.length - old_programs.length}`)
        } else {
            await bot.sendMessage(msg.chat.id, "Error while program updating( check logs!")
        }
    })

    bot.onText(/^\/update_groups$/, async (msg) => {
        if (!await userService.isAdmin(msg.from.id)) {
            return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
        }
        await bot.sendMessage(msg.chat.id, "The group list updating is starting!")
        const startTime = Date.now()

        let groups = []
        let isErrorless = true
        const old_groups = await groupService.getAll()
        await programService.getAll()
            .then(async (programs) => {
                for (const program of programs) {
                    const group_list = await get_group_list(program)
                    for (const group of group_list) {
                        groups.push({
                            name: group['name'],
                            id: group['id'],
                            language: group['language'],
                            href: group['href'],
                            age: group['age'],
                            studentCount: group['studentCount'],
                            program: group['programId'],
                        })
                    }

                    const stage = Math.floor(programs.indexOf(program) / programs.length * 100)
                    await bot.sendMessage(msg.chat.id, `${program.name} || It is ${stage}%.`)
                    await sleep(3000)
                }
            })
            .catch((e) => {
                isErrorless = false
                log.error("Ошибка при получении списка программ при обновлении списка групп.", {stack: e.stack})
            })
        if (isErrorless) {
            await groupService.updateAll(groups)
            const endTime = Date.now()
            await bot.sendMessage(msg.chat.id, `Group updating finished successfully. Action time: ` +
                `${Math.floor((endTime - startTime) / 1000)} сек.` +
                `Было: ${old_groups.length} || Стало: ${groups.length} || Разница: ${groups.length - old_groups.length}`)

        } else {
            await bot.sendMessage(msg.chat.id, "Error while group updating( check logs!")
        }

        async function get_group_list(program) {
            try {
                const response = await axios.get(`http://79.133.182.125:5000/api/schedule/get_group_list_by_programId/${program['id']}`)
                return response.data
            } catch (e) {
                log.error("Произошла ошибка при обновлении ебучих групп. Через 5 минут попробую продолжить")
                await sleep(5 * 60 * 1000)
                return get_group_list(program)
            }

        }
    })

    bot.onText(/^\/update_teachers$/, async (msg) => {
        if (!await userService.isAdmin(msg.from.id)) {
            return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
        }
        await bot.sendMessage(msg.chat.id, 'it is')
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
            const answer = await bot.sendMessage(msg.chat.id, JSON.stringify(msg, null, 2))
            await bot.editMessageText(JSON.stringify(msg, null, 2), {
                message_id: answer.message_id, chat_id: answer.chat.id
            })
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

    // bot.onText(/^\/group_stat$/, async (msg) => {
    //     try {
    //         if (!await userService.isAdmin(msg.from.id)) {
    //             return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
    //         }
    //         await bot.sendMessage(msg.chat.id, "started")
    //         const startTime = Date.now()
    //
    //         let group_stat = []
    //
    //         const groups = await groupService.getAll()
    //         for (const group of groups) {
    //             const program = await programService.getById(group.program)
    //             const faculty = await facultyService.getById(program.faculty)
    //             const users = await userService.getUsersByGroupId(group.id)
    //             group_stat.push({
    //                 id: group.id,
    //                 name: group.name,
    //                 program: program.name,
    //                 faculty: faculty.name,
    //                 students: group.studentCount,
    //                 our_users: users.length,
    //                 not_our_user: group.studentCount - users.length,
    //                 percent: Math.floor(users.length / group.studentCount * 100)
    //             })
    //         }
    //
    //         const sortedGroupStat = group_stat.slice().sort((a, b) => b.percent - a.percent);
    //
    //         await fs.writeFile("./group_stat.json", JSON.stringify(sortedGroupStat, null, 3))
    //
    //         const endTime = Date.now()
    //         await bot.sendDocument(msg.chat.id, './group_stat.json', {caption: `Action time: ${(endTime - startTime) / 1000} сек.`})
    //     } catch (e) {
    //         console.log(e)
    //         log.error("error", {stack: e.stack})
    //     }
    // })

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
            let msg_text = `Информация о юзере id: ${userId}\n` + JSON.stringify(user, null, 4)

            const group = await groupService.getById(user.group)
            if (group) {
                msg_text += `\n\n Информация о группе id: ${group.id}\n` + JSON.stringify(group, null, 4)
                const program = await programService.getById(group.program)
                const faculty = await facultyService.getById(program.faculty)

                msg_text += `\n\n Информация о программе id: ${program.id}\n` + JSON.stringify(program, null, 4)
                msg_text += `\n\n Информация о факультете id: ${faculty.id}\n` + JSON.stringify(faculty, null, 4)
            }

            await bot.sendMessage(msg.chat.id, msg_text)
        } catch (e) {
            log.error("Ошибочка при /get_user", {stack: e.stack})
        }

    });

    bot.onText(/^\/get_logs/i, async (msg) => {
        try {
            if (!await userService.isAdmin(msg.from.id)) {
                return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
            }

            await bot.sendDocument(msg.chat.id, './logs.log')
        } catch (e) {
            log.error("Ошибочка при /get_user", {stack: e.stack})
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

            const users = (await userActivityService.getUnactiveUsers())
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
        bot.onText(/\/stop/, async(msg)=> {
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

            const users = (await userService.getAll()).slice(32, 1000)
            console.log(users)

            let success = []
            let bad = []

            await bot.sendMessage(msg.chat.id, 'Начал спамить. /stop чтобы принудительно завершить спам\n' + msg_text, {disable_web_page_preview:true})
            const status_msg = await bot.sendMessage(msg.chat.id, "Тут будет прогресс")
            const startTime = Date.now()

            for (const user of users) {
                if (stop){
                    break
                }
                await sleep(1000)
                let status = true
                try {
                    await bot.sendMessage(user.userId, msg_text, {disable_web_page_preview:true})
                    log.info(`User ${user.userId} получил spm message`)
                    success.push(user.userId)
                } catch (e) {
                    status = false
                    log.info(`User ${user.userId} не получил спам сообщение.`, {stack: e.stack})
                    bad.push(user.userId)
                } finally {
                    await sleep(1000)
                    await bot.editMessageText(`Прошло: ${Math.floor((Date.now() - startTime)/1000)} с. || ${users.indexOf(user)}/${users.length} Отправлено. Статус отправки: ${status}`,
                        {message_id:status_msg.message_id, chat_id:status_msg.chat.id})
                }
            }

            await bot.sendMessage(msg.chat.id, 'Done')

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