import axios from "axios";
import log from "../../../logging/logging.js";
import {sleep} from "../../../handlers/adminCommandHandler.js";
import departmentService from "../../../services/departmentService.js";

export async function updateDepartmentsCommandController(hard = false){
    async function getDepartmentList() {
        try {
            const response = await axios.get(`https://api.tolyan.me/teacherSchedule/get_departments_list`)
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
        log.warn("Начинаю обновление списка кафедр. hard = " + hard)

        const startTime = Date.now()

        const old_departments = await departmentService.getAll()
        const departments = await getDepartmentList()

        const endTime = Date.now()

        if (departments.length > old_departments.length || hard){
            await departmentService.updateAll(departments)
            log.warn(`Обновление кафедр прошло успешно. Время выполнения:` +
                `${Math.floor((endTime - startTime) / 1000)} сек.\n` +
                `Было: ${old_departments.length} || Стало: ${departments.length} || Разница: ${departments.length - old_departments.length}`)
        }else{
            log.error("Полученных кафедр оказалось меньше чем было или равно. Я не стал их обновлять. " +
                "Время выполнения" + Math.floor((endTime - startTime) / 1000) + "сек." +
                `Было: ${old_departments.length}. Я получил: ${departments.length}`)
        }

    }catch (e) {
        log.error(`Произошла непредвиденная ошибка в updateProfilesCommandController() :` + e.message, {stack: e.stack})
    }
}