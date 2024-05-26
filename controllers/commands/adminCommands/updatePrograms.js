import log from "../../../logging/logging.js";
import programService from "../../../services/programService.js";
import facultyService from "../../../services/facultyService.js";
import axios from "axios";
import {sleep} from "../../../handlers/adminCommandHandler.js";


export async function updateProgramsCommandController(hard = false) {
    async function getProgramList(facultyId) {
        try {
            const response = await axios.get(`https://api.tolyan.me/express/api/schedule/get_program_list_by_facultyId/${facultyId}`)
            if (response.status === 200){
                return response.data
            }
        } catch (e) {
            log.error("Ошибка при получении списка программ. Жду 5 минут и пробую снова. facultyId: " + facultyId + "Ошибка: " + e.message, {stack: e.stack})
            await sleep(5 * 60 * 1000)
            return await getProgramList(facultyId)
        }
    }

    try {
        log.info("Начинаю обновление списка программ. hard = " + hard)

        const startTime = Date.now()

        const old_programs = await programService.getAll()
        let programs = []

        const faculties = await facultyService.getAll()

        for (const faculty of faculties) {
            await sleep(3000)

            const program_list = await getProgramList(faculty.id)

            for (const program of program_list) {
                programs.push({
                    name: program['name'],
                    id: program['id'],
                    href: program['href'],
                    faculty: program['facultyId'],
                })
            }

            const stage = Math.floor(faculties.indexOf(faculty) / faculties.length * 100)
            log.info(`Получены программы факультета: ${faculty.name}. ` +
                `Стадия обновления: ${stage}%`)
        }

        const availableRange = old_programs.length * 0.3;

        const endTime = Date.now()
        if (programs.length + availableRange >= old_programs.length || hard){
            await programService.updateAll(programs)
            log.info(`Обновление программ прошло успешно. Время выполнения:` +
                `${Math.floor((endTime - startTime) / 1000)} сек.\n` +
                `Было: ${old_programs.length} || Стало: ${programs.length} || Разница: ${programs.length - old_programs.length}`)
        }else{
            log.error("Полученных программ оказалось меньше чем было или равно. Я не стал их обновлять. " +
                "Время выполнения" + Math.floor((endTime - startTime) / 1000) + "сек." +
                `Было: ${old_programs.length}. Я получил: ${programs.length}`)
        }
        await sleep(1000)

    } catch (e) {
        log.error(`Произошла непредвиденная ошибка в updateProgramsCommandController() :` + e.message, {stack: e.stack})
    }
}