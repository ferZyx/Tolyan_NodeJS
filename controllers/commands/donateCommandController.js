import {commandAntiSpamMiddleware} from "../../middlewares/bot/commandAntiSpamMiddleware.js";
import log from "../../logging/logging.js";
import config from "../../config.js";
import {bot} from "../../app.js";

const errorCatch = async (e, msg) => {
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В donateCommandController. Юзеру сказано что бот прибоел.` + e.message, {
        stack: e.stack,
        userId: msg.chat.id
    })
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}

const kaspiNumber = '<code>4400430139065632</code>'

const msg_text = 'Дорогие друзья,\n' +
    '\n' +
    'Мы стремимся предоставлять вам лучший контент, и ваша поддержка помогает нам в этом. Если вы желаете помочь Толику вырасти, ваш донат будет весьма полезен. \n' +
    '\n' +
    'В этот раз все вложения не уйдут на компотики и пиццу в столовке, так как с увеличением Толика, выросли и его потребности. Сейчас нам нужно:\n' +
    '1)  Постоянно улучшать контент.\n' +
    '2)  Покрывать расходы за сервер, домен и прочие сервисы.\n' +
    '3)  Развивать и расширять Толика во всех направлениях.\n' +
    '\n' +
    'Даже маленький вклад в 100 тенге будет для нас ОГРОМНОЙ мотивацией стараться и делать это ради всех студентов КарУ. Если вы готовы поддержать нас, вы можете сделать это через kaspi: ' + kaspiNumber +
    '\n\n' +
    'Благодарим вас за веру в нас и за вашу щедрость. Спасибо, что вы с нами!'

export async function donateCommandController(msg) {
    await commandAntiSpamMiddleware(msg, async () => {
        try {
            log.warn(`User ${msg.chat.id} прописал /donate`, {userId: msg.chat.id})

            await bot.sendMessage(msg.chat.id, msg_text, {parse_mode: 'HTML'})
            await bot.forwardMessage(config.LOG_CHANEL_ID, msg.chat.id, msg.message_id)
        } catch (e) {
            await errorCatch(e, msg)
        }
    })
}