import ScheduleController from "../controllers/ScheduleController.js";
import log from "../logging/logging.js";
import TeacherController from "../controllers/TeacherProfileController.js";
import config from "../config.js";
import {commandAntiSpamMiddleware} from "../middlewares/bot/commandAntiSpamMiddleware.js";
import {startCommandController} from "../controllers/commands/startCommandController.js";
import {scheduleCommandController} from "../controllers/commands/scheduleCommandController.js";
import blackListService from "../services/blackListService.js";




// done
export default function setupCommandHandlers(bot) {
    bot.onText(/^\/start/i, async (msg) => {
        try {
            await commandAntiSpamMiddleware(bot, msg, async () => {
                await startCommandController(bot, msg)
            })
        } catch (e) {
            log.error("ВАЖНО! ОШИБКА В СТАРТ Хендлере!", {stack: e.stack, msg, userId: msg.chat.id})
        }
    })


    bot.onText(/^\/schedule/i, async (msg) => {
        try {
            await commandAntiSpamMiddleware(bot, msg, async () => {
                await scheduleCommandController(bot, msg)
            })
        }catch (e) {
            log.error("ВАЖНО! ОШИБКА В schedule Хендлере!", {stack: e.stack, msg, userId: msg.chat.id})

        }
    })
    bot.onText(/^расписание/i, async (msg) => {
        try {
            await commandAntiSpamMiddleware(bot, msg, async () => {
                await scheduleCommandController(bot, msg)
            })
        }catch (e) {
            log.error("ВАЖНО! ОШИБКА В schedule Хендлере!", {stack: e.stack, msg, userId: msg.chat.id})

        }
    });

    bot.onText(/^профиль(\s(\S{2,}))?$/i, async (msg, match) => {
        await commandAntiSpamMiddleware(bot, msg, async () => {
            const surname = match[2];

            try {
                if (!surname) {
                    await bot.sendMessage(msg.chat.id, '⚠️ После команды "профиль" должна быть указана фамилия.');
                    return;
                }

                const answer = await bot.sendMessage(msg.chat.id, `🪄 Пытаюсь накодовать профиль препода с фамилией: ${surname}. Вжух!`, {parse_mode: 'HTML'});

                await TeacherController.findProfiles(bot, answer, surname);
            } catch (e) {
                log.error("ВАЖНО! ОШИБКА В ПРОФИЛЬ КОМАНД ХЕДЛЕРЕ", {stack: e.stack, msg, userId: msg.chat.id})
            }
        })
    });
    bot.onText(/^профиль\s(\S)$/i, async (msg) => {
        await commandAntiSpamMiddleware(bot, msg, async () => {
            await bot.sendMessage(msg.chat.id, '⚠️ Фамилия для поиска профиля должна состоять как минимум из 2 символов.')
                .catch(e => log.error("ВАЖНО! ОШИБКА В ПРОФИЛЬ КОМАНД ХЕДЛЕРЕ", {
                    stack: e.stack,
                    msg,
                    userId: msg.chat.id
                }))
        })
    });

    bot.onText(/^\/help/i, async (msg) => {
        await commandAntiSpamMiddleware(bot, msg, async () => {
            const msg_text = "📝 Доступные команды:\n\n" +
                "🔴 /start - Найти расписание.\n" +
                "🟠 /schedule - Получить своё расписание.\n" +
                "🟡 Расписание (без /) - Аналог /schedule.\n" +
                "🟢 Профиль [Фамилия преподавателя] (без /) - Получить профиль с данными преподавателя. (пример: профиль Иванов)\n" +
                "🔵 /news - Получить новости о последнем обновлении бота, дальнейших планах.  \n" +
                "🟣 /donate - угостить разработчиков компотом🥃 👉👈\n\n" +
                "❗️ В случае возникновения ошибок вы всегда можете обратиться к разработчикам напрямую: @lena_nebot\n" +
                "🥹 Будем благодарны, если Вы расскажете о нас своим друзьям(🐒) или преподавателям(👩‍🏫).\n"
            await bot.sendMessage(msg.chat.id, msg_text)
        })
    })

    bot.onText(/^\/news/i, async (msg) => {
        await commandAntiSpamMiddleware(bot, msg, async () => {
            const msg_text = '👋 Рад что тебе интересно наше обновление!\n' +
                '\n' +
                '🟡Добавлено расписание ПРЕПОДАВАТЕЛЕЙ. Пиши /start и получай его! Не забудь рассказать об этом другим преподам!\n' +
                '⚫️Добавлена возможность просматривать профили преподавателей.\n' +
                '⚪️ Добавлена простейшая антиспам система которая не дает так просто тыкать на кнопочки и ломать меня полностью!'
            await bot.sendMessage(msg.chat.id, msg_text)
        })
    })

    bot.onText(/^\/donate/i, async (msg) => {
        await commandAntiSpamMiddleware(bot, msg, async () => {
            log.warn(`User ${msg.chat.id} прописал /donate`, {userId: msg.chat.id})
            const msg_text = 'Над ботом активно работают 2 начинающих разработчика, которых вы можете поддержать, угостив ' +
                'их стаканом компота или даже кружечкой горячего кофе!\n Каспи: <code>4400430139065632</code>'
            await bot.sendMessage(msg.chat.id, msg_text, {parse_mode: 'HTML'})
            await bot.forwardMessage(config.LOG_CHANEL_ID, msg.chat.id, msg.message_id)
        })
    })

    bot.on('message', async (msg) => {
        const isBlackListed = await blackListService.isBlackListed(msg.chat.id)
        if (!isBlackListed) {
            if (msg.chat.type !== 'private') {
                log.silly(`User ${msg.chat.id} || ${msg.from.id} написал в чат: ${msg.text}`, {
                    msg,
                    userId: msg.chat.id
                })
            } else {
                log.silly(`User ${msg.chat.id} написал в чат: ${msg.text}`, {msg, userId: msg.chat.id})
            }
        }
    });
}
