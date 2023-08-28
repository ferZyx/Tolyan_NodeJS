import ScheduleController from "../controllers/ScheduleController.js";
import log from "../logging/logging.js";
import TeacherController from "../controllers/TeacherController.js";

// done
export default function setupCommandHandlers(bot) {

    bot.onText(/^\/start$/, async (msg) => {
        await ScheduleController.startCommand(bot, msg)
            .catch(e => log.error("ВАЖНО! ОШИБКА В СТАРТ ХЕНДЕРЕ!", {stack:e.stack, msg}))
    })

    bot.onText(/^\/schedule$/, async (msg) => {
        await ScheduleController.getSchedule(bot, msg)
            .catch(e => log.error("ВАЖНО! ОШИБКА В ШЕДУЛ КОМАНД ХЕДЛЕРЕ", {stack:e.stack, msg}))
    })
    bot.onText(/^расписание$/i, async (msg) => {
        await ScheduleController.getSchedule(bot, msg)
            .catch(e => log.error("ВАЖНО! ОШИБКА В РАСПИСАНЕ КОМАНД ХЕДЛЕРЕ", {stack:e.stack, msg}))

    });

    bot.onText(/^профиль(\s(\S{2,}))?$/i, async (msg, match) => {
        const surname = match[2];

        try {
            if (!surname) {
                await bot.sendMessage(msg.chat.id, '⚠️ После команды "профиль" должна быть указана фамилия.');
                return;
            }

            const answer = await bot.sendMessage(msg.chat.id, `🪄 Пытаюсь накодовать профиль препода с фамилией: ${surname}. Вжух!`, {parse_mode: 'html'});

            await TeacherController.findProfiles(bot, answer, surname);
        } catch (e) {
            log.error("ВАЖНО! ОШИБКА В ПРОФИЛЬ КОМАНД ХЕДЛЕРЕ", {stack:e.stack, msg})
        }
    });
    bot.onText(/^профиль\s(\S)$/i, async (msg) => {
        await bot.sendMessage(msg.chat.id, '⚠️ Фамилия для поиска профиля должна состоять как минимум из 2 символов.')
            .catch(e => log.error("ВАЖНО! ОШИБКА В ПРОФИЛЬ КОМАНД ХЕДЛЕРЕ", {stack:e.stack, msg}))
    });

    bot.on('message', async (msg) => {
        log.silly(`User ${msg.chat.id} написал в чат: ${msg.text}`, {msg})
    });
}
