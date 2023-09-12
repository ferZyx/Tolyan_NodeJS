import facultyService from "../../../services/facultyService.js";
import axios from "axios";
import log from "../../../logging/logging.js";


export async function updateFacultiesCommandController(hard = false) {
    try {
        log.warn("Начинаю обновление списка факультетов")

        const old_faculties = await facultyService.getAll()

        await axios.get("https://api.tolyan.me/schedule/get_faculty_list")
            .then(async (response) => {
                const faculties = response.data

                if (faculties.length > old_faculties || hard){
                    await facultyService.updateAll(faculties)

                    log.warn("Обновление факультетов прошло успешно!\n" +
                        `Было: ${old_faculties.length} || Стало: ${faculties.length} || Разница: ${faculties.length - old_faculties.length}`)
                }else{
                    log.error("Полученных факультетов оказалось меньше чем было или равно. Я не стал их обновлять. " +
                        `Было: ${old_faculties.length}. Я получил: ${faculties.length}`)
                }

            })
            .catch(async (e) => {
                log.error("Произошла ошибка при обновлении списка факультетов." +
                    " Жду 5 минут и пробую снова. \nОшибка:" + e.message, {stack: e.stack})
                setTimeout(() => {
                    updateFacultiesCommandController()
                }, 5 * 60 * 1000)
            })
    } catch (e) {
        log.error(`Произошла непредвиденная ошибка в updateFacultiesCommandController() :` + e.message, {stack: e.stack})
    }
}