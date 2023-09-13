import {updateFacultiesCommandController} from "../controllers/commands/adminCommands/updateFaculties.js";
import {updateProgramsCommandController} from "../controllers/commands/adminCommands/updatePrograms.js";
import {updateGroupsCommandController} from "../controllers/commands/adminCommands/updateGroups.js";
import {updateProfilesCommandController} from "../controllers/commands/adminCommands/updateProfiles.js";
import {updateDepartmentsCommandController} from "../controllers/commands/adminCommands/updateDepartments.js";
import {updateTeachersCommandController} from "../controllers/commands/adminCommands/updateTeachers.js";
import log from "../logging/logging.js";
import cron from "node-cron";

export async function setupDailyDataUpdate(){
    cron.schedule('00 5 * * *', async () => {
        const startTime = Date.now()
        log.warn("Начинаю ежедневное обновление резервных данных из ксу.")
        try{
            await updateFacultiesCommandController()
            await updateProgramsCommandController()
            await updateGroupsCommandController()
            await updateProfilesCommandController()
            await updateDepartmentsCommandController()
            await updateTeachersCommandController()
            const endTime = Date.now()
            log.warn('Обновление резервных данных успешно завершено. Время выполнения: ' + Math.floor((endTime - startTime) / 1000))
        }catch (e) {
            log.error("Произошла ошибка при ежедневном обновлении данных. " + e.message, {stack:e.stack})
        }
    });
}