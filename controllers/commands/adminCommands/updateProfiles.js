import axios from "axios";
import teacherProfileService from "../../../services/profileService.js";
import log from "../../../logging/logging.js";
import {sleep} from "../../../handlers/adminCommandHandler.js";

export async function updateProfilesCommandController(hard = false){
    async function getProfileList() {
        try {
            const response = await axios.get(`https://api.tolyan.me/teacher/get_all_teachers`)
            if (response.status === 200){
                return response.data
            }
        } catch (e) {
            log.error("Ошибка при получении списка профилей. Жду 5 минут и пробую снова. Ошибка: " + e.message, {stack: e.stack})
            await sleep(5 * 60 * 1000)
            return await getProfileList()
        }
    }

    try{
        log.warn("Начинаю обновление списка профилей. hard = " + hard)

        const startTime = Date.now()

        const old_profiles = await teacherProfileService.getAll()
        const profiles = await getProfileList()

        const endTime = Date.now()

        if (profiles.length >= old_profiles.length || hard){
            await teacherProfileService.updateAll(profiles)
            log.warn(`Обновление профилей прошло успешно. Время выполнения:` +
                `${Math.floor((endTime - startTime) / 1000)} сек.\n` +
                `Было: ${old_profiles.length} || Стало: ${profiles.length} || Разница: ${profiles.length - old_profiles.length}`)
        }else{
            log.error("Полученных профилей оказалось меньше чем было или равно. Я не стал их обновлять. " +
                "Время выполнения" + Math.floor((endTime - startTime) / 1000) + "сек." +
                `Было: ${old_profiles.length}. Я получил: ${profiles.length}`)
        }
    }catch (e) {
        log.error(`Произошла непредвиденная ошибка в updateProfilesCommandController() :` + e.message, {stack: e.stack})
    }
}