import {isAdminMiddleware} from "../../../middlewares/bot/isAdminMiddleware.js";
import log from "../../../logging/logging.js";
import {bot} from "../../../app.js";
import groupService from "../../../services/groupService.js";
import userService from "../../../services/userService.js";
import {sleep} from "../../../handlers/adminCommandHandler.js";


export async function piarAdminCommandController(msg) {
    await isAdminMiddleware(msg, async () => {
        try {
            const msg_text = msg.text.replace("/piar", "")
            if (!msg_text){
                return await bot.sendMessage(msg.chat.id, "Забыл пиар-текст написать, брат!")
            }

            const startTime = Date.now()
            await bot.sendMessage(msg.chat.id, "Начинаю пиарить жоска!\n" + msg_text)

            let group_stat = []

            const groups = await groupService.getAll()
            const users = await userService.getAll()

            for (const group of groups) {
                const our_users = users.filter(user => user.group === group.id)
                group_stat.push({
                    id: group.id,
                    name: group.name,
                    students: group.studentCount,
                    our_users: our_users.length,
                    not_our_users: group.studentCount - our_users.length,
                    ratio: our_users.length / group.studentCount
                })
            }

            const sortedGroupStat = group_stat.filter((obj) => (obj.our_users !== 0) && ((obj.not_our_users > 15) || (obj.ratio <= 0.5)))
                .sort((a, b) => b.not_our_users - a.not_our_users)


            let successCounter = 0
            let badCounter = 0
            for (const group of sortedGroupStat) {
                const groupUsers = users.filter((user) => user.group === group.id)
                for (const user of groupUsers) {
                    const userGroup = sortedGroupStat.find(obj => obj.id === user.group)
                    await sleep( 45 * 1000)
                    bot.sendMessage(user.userId, msg_text)
                        .then(() => {
                            log.info(`Отправил сообщение юзеру ${user.userId} из группы ${user.group}, в ней потенциальных наших юзеров: ${userGroup.not_our_users}`)
                            successCounter += 1
                        })
                        .catch((e) => {
                            log.info(`User ${user.userId} не получил сообщение из за ошибки: ` + e.message)
                            badCounter += 1
                        })
                }
            }
            const actionTime = Math.floor((Date.now() - startTime) / 1000)
            await bot.sendMessage(msg.chat.id, `Пиар спам завершен за ${actionTime} сек. Отправлено: ${successCounter}| Не отправлено: ${badCounter}`)

        } catch (e) {
            log.error("Ошибочка при пиар спаме:" + e.message, {stack: e.stack})
        }
    })
}