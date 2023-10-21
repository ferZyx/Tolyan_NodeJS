import userService from "../../services/userService.js";
import {bot} from "../../app.js";
import log from "../../logging/logging.js";
import i18next from "i18next";

export async function isAdminMiddleware(msg, next) {
    try{
        const user_language = await userService.getUserLanguage(msg.chat.id)
        if (!await userService.isAdmin(msg.from.id)) {
            const msg_text = i18next.t('no_permissions', {lng:user_language})
            return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
        }

        // Выполняем следующий хендлер
        await next();
    }catch (e) {
        log.error(`ВАЖНО! user: ${msg.chat.id}! Ошибка при проверке на админа!!!`)
    }

}