import userService from "../../services/userService.js";
import {bot} from "../../app.js";
import log from "../../logging/logging.js";

export async function isAdminMiddleware(msg, next) {
    try{
        if (!await userService.isAdmin(msg.from.id)) {
            return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
        }

        // Выполняем следующий хендлер
        await next();
    }catch (e) {
        log.error(`ВАЖНО! user: ${msg.chat.id}! Ошибка при проверке на админа!!!`)
    }

}