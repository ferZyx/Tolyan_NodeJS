import groupService from "../../../services/groupService.js";
import programService from "../../../services/programService.js";
import log from "../../../logging/logging.js";
import axios from "axios";
import {sleep} from "../../../handlers/adminCommandHandler.js";

export async function updateGroupsCommandController(hard = false){
    async function getGroupList(programId) {
        try {
            const response = await axios.get(`https://api.tolyan.me/express/api/schedule/get_group_list_by_programId/${programId}`)
            if (response.status === 200){
                return response.data
            }
        } catch (e) {
            log.error("Ошибка при получении списка групп. Жду 5 минут и пробую снова. programId: " + programId + "Ошибка: " + e.message, {stack: e.stack})
            await sleep(5 * 60 * 1000)
            return await getGroupList(programId)
        }
    }


    try {
        log.warn("Начинаю обновление списка групп. hard = " + hard)
        await sleep(1000)

        const startTime = Date.now()

        const old_groups = await groupService.getAll()
        let groups = []

        const programs = await programService.getAll()

        for (const program of programs) {
            await sleep(3000)

            const group_list = await getGroupList(program.id)

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
            log.info(`Получены группы программы: ${program.name}. ` +
                `Стадия обновления: ${stage}%`)
        }

        const endTime = Date.now()

        if (groups.length >= old_groups.length || hard){
            await groupService.updateAll(groups)
            log.warn(`Обновление групп прошло успешно. Время выполнения:` +
                `${Math.floor((endTime - startTime) / 1000)} сек.\n` +
                `Было: ${old_groups.length} || Стало: ${groups.length} || Разница: ${groups.length - old_groups.length}`)
        }else{
            log.error("Полученных групп оказалось меньше чем было или равно. Я не стал их обновлять. " +
                "Время выполнения" + Math.floor((endTime - startTime) / 1000) + "сек." +
                `Было: ${old_groups.length}. Я получил: ${groups.length}`)
        }
        await sleep(1000)
    }catch (e) {
        log.error(`Произошла непредвиденная ошибка в updateGroupsCommandController() :` + e.message, {stack: e.stack})
    }
}