import log from "../../logging/logging.js";
import {bot} from "../../app.js";

const inline_keyboard = {
    inline_keyboard: [[{text: "🤓 Студент", callback_data: "faculty|0"}], [{
        text: "👩‍🏫 Преподаватель",
        callback_data: "department|0"
    }], [{text: " ", callback_data: "nothing"}, {text: "❌", callback_data: "delete"}, {
        text: " ",
        callback_data: "nothing"
    }]]
}

const msg_text = '👋 Чье расписание тебе нужно?\n\n' +
    '<i>P.S. Если тебе лень тыкать по кнопочкам - можешь воспользоваться</i> <b>Поиском</b>.\n' +
    'Подробнее /search'

const errorCatch = async (e, msg) => {
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В newScheduleCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack})
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}


export async function newScheduleCommandController(msg){
    try{
        await bot.sendMessage(msg.chat.id, msg_text, {reply_markup: inline_keyboard, parse_mode:"HTML"})
    }catch (e) {
        await errorCatch(e,msg)
    }
}

export async function redirectToNewScheduleMenu(msgToEdit){
    try{
        await bot.editMessageText(msg_text, {message_id:msgToEdit.message_id, chat_id:msgToEdit.chat.id ,reply_markup: inline_keyboard, parse_mode:"HTML"})
    }catch (e) {
        await errorCatch(e,msgToEdit)
    }
}