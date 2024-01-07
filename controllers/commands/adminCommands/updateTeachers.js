import axios from "axios";
import log from "../../../logging/logging.js";
import {sleep} from "../../../handlers/adminCommandHandler.js";
import teacherService from "../../../services/teacherService.js";
import departmentService from "../../../services/departmentService.js";

export async function updateTeachersCommandController(hard = false) {
    async function getTeacherList(departmentId) {
        try {
            const response = await axios.get(`https://api.tolyan.me/express/api/teacherSchedule/get_teachers_list/${departmentId}`)
            if (response.status === 200) {
                return response.data
            }
        } catch (e) {
            log.error("Ошибка при получении списка преподов. Жду 5 минут и пробую снова. departmentId " + departmentId + "Ошибка: " + e.message, {stack: e.stack})
            await sleep(5 * 60 * 1000)
            return await getTeacherList(departmentId)
        }
    }

    try {
        log.warn("Начинаю обновление списка преподов. hard = " + hard)
        await sleep(1000)

        const startTime = Date.now()

        const old_teachers = await teacherService.getAll()
        let teachers = []

        const departments = await departmentService.getAll()

        for (const department of departments) {
            await sleep(3000)

            const teachers_list = await getTeacherList(department.id)

            for (const teacher of teachers_list) {
                teachers.push({
                    name: teacher['name'],
                    id: teacher['id'],
                    href: teacher['href'],
                    department: teacher['departmentId'],
                })
            }

            const stage = Math.floor(departments.indexOf(department) / departments.length * 100)
            log.info(`Получены программы факультета: ${department.name}. ` +
                `Стадия обновления: ${stage}%`)
        }

        const endTime = Date.now()

        if (teachers.length >= old_teachers.length || hard){
            await teacherService.updateAll(teachers)
            log.warn(`Обновление преподов прошло успешно. Время выполнения:` +
                `${Math.floor((endTime - startTime) / 1000)} сек.\n` +
                `Было: ${old_teachers.length} || Стало: ${teachers.length} || Разница: ${teachers.length - old_teachers.length}`)
        }else{
            log.error("Полученных преподов оказалось меньше чем было или равно. Я не стал их обновлять. " +
                "Время выполнения" + Math.floor((endTime - startTime) / 1000) + "сек." +
                `Было: ${old_teachers.length}. Я получил: ${teachers.length}`)
        }
        await sleep(1000)
    } catch (e) {
        log.error(`Произошла непредвиденная ошибка в updateTeachersCommandController() :` + e.message, {stack: e.stack})
    }
}