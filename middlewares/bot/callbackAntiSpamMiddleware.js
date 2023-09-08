import {userLastRequest} from "../../app.js";

export default async function(bot, call, next) {
    const userId = call.message.chat.id;
    const currentTime = new Date().getTime();

    // Проверяем, был ли предыдущий запрос от пользователя
    if (userLastRequest[userId]) {
        const timeDiff = currentTime - userLastRequest[userId];

        // Если прошло менее 0.5 секунд с предыдущего запроса, считаем это спамом
        if (timeDiff < 500) {
            // Отправляем уведомление о спаме пользователю
            await bot.answerCallbackQuery(call.id, {text:"🚯 Не спамь, пожалуйста!", show_alert:false})
            // Пропускаем выполнение хендлера
            return;
        }
    }

    // Сохраняем время текущего запроса пользователя
    userLastRequest[userId] = currentTime;

    // Выполняем следующий хендлер
    await next();
}