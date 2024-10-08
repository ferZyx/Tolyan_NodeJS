import axios from "axios";
import teacherProfileService from "../../../services/profileService.js";
import log from "../../../logging/logging.js";
import {sleep} from "../../../handlers/adminCommandHandler.js";

export async function updateProfilesCommandController(hard = false){
    async function getProfileList() {
        try {
            const response = await axios.get(`http://209.38.209.184:5000/express/api/teacher/get_all_teachers`)
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
        log.info("Начинаю обновление списка профилей. hard = " + hard)

        const startTime = Date.now()

        const old_profiles = await teacherProfileService.getAll()
        const profiles = await getProfileList()

        const endTime = Date.now()

        const availableRange = old_profiles.length * 0.3;

        if (profiles.length + availableRange >= old_profiles.length || hard){
            await teacherProfileService.updateAll(profiles)
            log.info(`Обновление профилей прошло успешно. Время выполнения:` +
                `${Math.floor((endTime - startTime) / 1000)} сек.\n` +
                `Было: ${old_profiles.length} || Стало: ${profiles.length} || Разница: ${profiles.length - old_profiles.length}`)
        }else{
            log.error("Полученных профилей оказалось меньше чем было или равно. Я не стал их обновлять. " +
                "Время выполнения" + Math.floor((endTime - startTime) / 1000) + "сек." +
                `Было: ${old_profiles.length}. Я получил: ${profiles.length}`)
        }
        await sleep(1000)

    }catch (e) {
        log.error(`Произошла непредвиденная ошибка в updateProfilesCommandController() :` + e.message, {stack: e.stack})
    }
}