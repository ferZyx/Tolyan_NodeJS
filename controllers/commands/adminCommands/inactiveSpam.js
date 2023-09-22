import userActivityService from "../../../services/userActivityService.js";
import log from "../../../logging/logging.js";
import {sleep} from "../../../handlers/adminCommandHandler.js";
import {bot} from "../../../app.js";

export async function inactiveSpamCommandController( msg) {
    try {
        const split_data = msg.text.split(" ")
        if (split_data.length < 2) {
            return await bot.sendMessage(msg.chat.id, "После команды должен быть текст!")
        }
        const msg_text = msg.text.replace("/inactiveSpam ", "")

        const users = await userActivityService.getUnactiveUsers()
        let success = []
        let bad = []

        log.warn(`Начал спамить неактивным юзерам. Всего их: ${users.length}.\n\nText:${msg_text}`)
        const startTime = Date.now()

        for (const user of users) {
            try {
                await bot.sendMessage(user.userId, msg_text)
                log.info(`User ${user.userId} получил inactiveSpam message. User index: ${users.indexOf(user)}`)
                success.push(user.userId)
            } catch (e) {
                log.info(`User ${user.userId} не получил inactiveSpam message. User index: ${users.indexOf(user)}`, {stack: e.stack})
                bad.push(user.userId)
            }
            await sleep(60 * 1000)
        }
        const endTime = Date.now()
        const actionTime = Math.floor((endTime - startTime) / 1000)
        log.warn(`Закончил спамить неактивным пользователям. Время работы:${actionTime} сек. \n` +
            `Кол-во отправленных: ${success.length}.\nКол-во неотправленных: ${bad.length}\nИх айди в метаданных. `,
            {bad, success})

    } catch (e) {
        log.error("Ошибочка при /unactive_spam", {stack: e.stack})
    }
}