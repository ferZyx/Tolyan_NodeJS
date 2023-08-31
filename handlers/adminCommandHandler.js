import axios from "axios";
import facultyService from "../services/facultyService.js";
import log from "../logging/logging.js";
import programService from "../services/programService.js";
import groupService from "../services/groupService.js";
import userService from "../services/userService.js";
import ScheduleController from "../controllers/ScheduleController.js";

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
            await axios.get("http://79.133.182.125:5000/api/schedule/get_faculty_list")
                .then(async (response) => {
                    if (response.status) {
                        const faculties = response.data

                        await facultyService.updateAll(faculties)

                        await bot.sendMessage(msg.chat.id, "Faculty list successfully updated! Congratulations!")
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
            await bot.sendMessage(msg.chat.id, `Program updating finished successfully. Action time: ${Math.floor((endTime - startTime) / 1000)} сек.`)
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
            await bot.sendMessage(msg.chat.id, `Group updating finished successfully. Action time: ${Math.floor((endTime - startTime) / 1000)} сек.`)
        } else {
            await bot.sendMessage(msg.chat.id, "Error while group updating( check logs!")
        }

        async function get_group_list(program) {
            try{
                const response = await axios.get(`http://79.133.182.125:5000/api/schedule/get_group_list_by_programId/${program['id']}`)
                return response.data
            }catch (e) {
                log.error("Произошла ошибка при обновлении ебучих групп. Через 5 минут попробую продолжить")
                await sleep(5*60*1000)
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


    bot.onText(/^\/test$/, async (msg) => {
        if (!await userService.isAdmin(msg.from.id)) {
            return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
        }
        log.warn("Тестовый лог!")
    })

    bot.onText(/^\/online$/, async (msg) => {
        if (!await userService.isAdmin(msg.from.id)) {
            return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
        }
        const users = await userService.getTodayActiveUsers()
        await bot.sendMessage(msg.chat.id, `Сегодня ботом воспользовались: ${users.length}`)
    })

    bot.onText(/^\/users$/, async (msg) => {
        try {
            if (!await userService.isAdmin(msg.from.id)) {
                return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
            }
            const userCount = await userService.countDocuments()
            await bot.sendMessage(msg.chat.id, `В базе данных Толяна ${userCount} пользователей.`)
        } catch (e) {
            log.error(e)
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
            log.error(e)
        }

    });

    bot.onText(/^\/get_user (\w+)$/i, async (msg, match) => {
        try {
            if (!await userService.isAdmin(msg.from.id)) {
                return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
            }
            const userId = match[1];

            const user = await userService.getUserById(userId)
            await bot.sendMessage(msg.chat.id, JSON.stringify(user, null, 4))
        } catch (e) {
            log.error(e)
        }

    });

    bot.onText(/^\/get_group (\w+)$/i, async (msg, match) => {
        try {
            if (!await userService.isAdmin(msg.from.id)) {
                return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
            }
            const groupId = match[1];

            const group = await groupService.getById(groupId)
            await bot.sendMessage(msg.chat.id, JSON.stringify(group, null, 4))
        } catch (e) {
            log.error(e)
        }

    });


}