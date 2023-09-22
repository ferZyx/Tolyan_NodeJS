import {bot, userLastRequest} from "../../app.js";
import log from "../../logging/logging.js";

export async function commandAntiSpamMiddleware(msg, next) {
    try {
        const userId = msg.chat.id;
        const currentTime = new Date().getTime();

        // Проверяем, был ли предыдущий запрос от пользователя
        if (userLastRequest[userId]) {
            const timeDiff = currentTime - userLastRequest[userId];

            // Если прошло менее секунды с предыдущего запроса, считаем это спамом
            if (timeDiff < 1000) {
                // Отправляем уведомление о спаме пользователю
                await bot.sendMessage(msg.chat.id, "🚯 Не спамь! ", {reply_to_message_id: msg.message_id})
                    .catch(e => {
                        log.error(`User ${msg.chat.id} got an error в command антиспам мидлваре` + e.message, {stack: e.stack})
                    })
                // Пропускаем выполнение хендлера
                return;
            }
        }

        // Сохраняем время текущего запроса пользователя
        userLastRequest[userId] = currentTime;

        // Выполняем следующий хендлер
        await next();
    } catch (e) {
        log.error("ВАЖНО! Ошибка в commandAntiSpamMiddleware. " + e.message, {stack: e.stack})
    }

}