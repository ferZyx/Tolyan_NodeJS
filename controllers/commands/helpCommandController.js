import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import {bot} from "../../app.js";
import log from "../../logging/logging.js";

const errorCatch = async (e, msg) =>{
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В helpCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack, userId: msg.chat.id})
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}

export async function helpCommandController(msg){
    await commandAntiSpamMiddleware(msg, async () => {
        try{
            const msg_text = "📝 Доступные команды:\n\n" +
                "🔴 /start - Получить навигационные кнопочки.\n" +
                "🟢 /remove - Удалить надоедливые кнопочки. \n" +
                "🔵 /new - Получить новое расписание.\n" +
                "🔴 /schedule - Получить своё расписание.\n" +
                "🟢 /search - Информация про поиск.\n" +
                "🔵 Расписание (без /) - Аналог /schedule.\n" +
                "🔴 Профиль [Фамилия преподавателя] (без /) - Получить профиль с данными преподавателя. (пример: профиль Иванов)\n" +
                "🟢 Поиск (без /) - аналог /search \n" +
                "🔵 /news - Получить новости о последнем обновлении бота, дальнейших планах.  \n" +
                "🔴 /donate - Поддержать Толяна.\n\n" +
                "❗️ В случае возникновения ошибок вы всегда можете обратиться к разработчикам напрямую: @lena_nebot\n" +
                "🥹 Будем благодарны, если Вы расскажете о нас своим друзьям(🐒) или преподавателям(👩‍🏫).\n"
            await bot.sendMessage(msg.chat.id, msg_text)
        }catch (e) {
            await errorCatch(e, msg)
        }
    })
}