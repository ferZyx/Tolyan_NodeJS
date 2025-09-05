import axios from "axios";
import log from "../../../logging/logging.js";
import {sleep} from "../../../handlers/adminCommandHandler.js";
import facultyService from "../../../services/facultyService.js";
import config from "../../../config.js";


export async function updateFacultiesCommandController(hard = false) {
    async function getFacultyList() {
        try {
            const response = await axios.get(`${config.KSU_HELPER_URL}/express/api/schedule/get_faculty_list`)
            if (response.status === 200){
                return response.data
            }
        } catch (e) {
            log.error("Ошибка при получении списка факультетов. Жду 5 минут и пробую снова. Ошибка: " + e.message, {stack: e.stack})
            await sleep(5 * 60 * 1000)
            return await getFacultyList()
        }
    }

    try {
        log.info("Начинаю обновление списка факультетов. hard = " + hard)

        const startTime = Date.now()

        const old_faculties = await facultyService.getAll()
        const faculties = await getFacultyList()

        const endTime = Date.now()

        const availableRange = old_faculties.length * 0.3;

        if (faculties.length + availableRange >= old_faculties.length || hard){
            await facultyService.updateAll(faculties)
            log.info(`Обновление факультетов прошло успешно. Время выполнения:` +
                `${Math.floor((endTime - startTime) / 1000)} сек.\n` +
                `Было: ${old_faculties.length} || Стало: ${faculties.length} || Разница: ${faculties.length - old_faculties.length}`)
        }else{
            log.error("Полученных факультетов оказалось меньше чем было или равно. Я не стал их обновлять. " +
                "Время выполнения" + Math.floor((endTime - startTime) / 1000) + "сек." +
                `Было: ${old_faculties.length}. Я получил: ${faculties.length}`)
        }
        await sleep(1000)

    } catch (e) {
        log.error(`Произошла непредвиденная ошибка в updateFacultiesCommandController() :` + e.message, {stack: e.stack})
    }
}