import userService from "../../../services/userService.js"
import {bot} from "../../../app.js";
import groupService from "../../../services/groupService.js";
import programService from "../../../services/programService.js";
import facultyService from "../../../services/facultyService.js";
import teacherService from "../../../services/teacherService.js";
import ScheduleController from "../../ScheduleController.js";
import log from "../../../logging/logging.js";

export async function getAndSendUserInfoByUserId(userId, toChatId) {
    const user = await userService.getUserById(userId)
    if (!user) {
        return await bot.sendMessage(toChatId, "Не найден такой юзер. НЕТУ!")
    }

    const group = await groupService.getById(user.group)
    let group_users = null
    let program = null
    let faculty = null
    if (group) {
        group_users = await userService.getUsersCountByGroupId(group.id)
        program = await programService.getById(group.program)
        faculty = await facultyService.getById(program.faculty)
    }
    const teacher = await teacherService.getById(user.teacher)


    const userDetails = [
        {key: 'Тип', value: user.userType},
        {key: 'username', value: user.username ? '@' + user.username : user.username},
        {key: 'Название группы', value: user.userTitle},
        {key: 'Имя', value: user.firstName},
        {key: 'Фамилия', value: user.lastName},
        {key: 'Тип расписания', value: user.scheduleType},
        {key: 'Язык интерфейса', value: user.language},
        {key: '\nГруппа', value: group ? group.name + " | " + group.id : undefined},
        {key: 'В группе', value: group ? `${group.studentCount} | Пользуются ботом: ${group_users}` : undefined},
        {key: 'Программа', value: program ? `${program.name} | id: ${program.id}` : undefined},
        {key: 'Факультет', value: faculty ? `${faculty.name} | id: ${faculty.id}` : undefined},
        {key: '\nПрепод', value:+ teacher ? teacher.name + " | " + teacher.id : undefined},
        {key: '\nПоследняя активность', value: `${ScheduleController.formatElapsedTime((new Date(user.updatedAt).getTime()))} назад`},
    ];

    let msg_text = `Информация о юзере id: ${userId}\n`
    userDetails.forEach(detail => {
        if (detail.value) {
            msg_text += `${detail.key}: ${detail.value}\n`
        }
    });

    await bot.sendMessage(toChatId, msg_text)
}

export async function getUserCommandController(msg) {
    try {
        if (!await userService.isAdmin(msg.from.id)) {
            return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
        }
        const userId = parseFloat(msg.text.replace('/get_user', ''))
        if (isNaN(userId)) {
            return await bot.sendMessage(msg.chat.id, "UserId is NaN")
        }

        await getAndSendUserInfoByUserId(userId, msg.chat.id)
    } catch (e) {
        log.error("Ошибочка при /get_user", {stack: e.stack})
    }

}