import userService from "../../services/userService.js";

export async function isAdminMiddleware(bot, msg, next) {
    if (!await userService.isAdmin(msg.from.id)) {
        return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
    }

    // Выполняем следующий хендлер
    await next();
}