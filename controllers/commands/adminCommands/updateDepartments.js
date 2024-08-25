import axios from "axios";
import log from "../../../logging/logging.js";
import {sleep} from "../../../handlers/adminCommandHandler.js";
import departmentService from "../../../services/departmentService.js";

export async function updateDepartmentsCommandController(hard = false){
    async function getDepartmentList() {
        try {
            const response = await axios.get(`http://209.38.209.184:5000/express/api/teacherSchedule/get_departments_list`)
            if (response.status === 200){
                return response.data
            }
        } catch (e) {
            log.error("Ошибка при получении списка кафедр. Жду 5 минут и пробую снова. Ошибка: " + e.message, {stack: e.stack})
            await sleep(5 * 60 * 1000)
            return await getDepartmentList()
        }
    }
    try{
        log.info("Начинаю обновление списка кафедр. hard = " + hard)

        const startTime = Date.now()

        const old_departments = await departmentService.getAll()
        const departments = await getDepartmentList()

        const endTime = Date.now()

        const availableRange = old_departments.length * 0.3;

        if (departments.length + availableRange >= old_departments.length || hard){
            await departmentService.updateAll(departments)
            log.info(`Обновление кафедр прошло успешно. Время выполнения:` +
                `${Math.floor((endTime - startTime) / 1000)} сек.\n` +
                `Было: ${old_departments.length} || Стало: ${departments.length} || Разница: ${departments.length - old_departments.length}`)
        }else{
            log.error("Полученных кафедр оказалось меньше чем было или равно. Я не стал их обновлять. " +
                "Время выполнения" + Math.floor((endTime - startTime) / 1000) + "сек." +
                `Было: ${old_departments.length}. Я получил: ${departments.length}`)
        }
        await sleep(1000)

    }catch (e) {
        log.error(`Произошла непредвиденная ошибка в updateProfilesCommandController() :` + e.message, {stack: e.stack})
    }
}