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

const msg_text = "👋 Чье расписание тебе нужно?"

const errorCatch = async (e, msg) => {
    log.error(`ВАЖНО!User ${msg.chat.id}! ОШИБКА В newScheduleCommandController. Юзеру сказано что бот прибоел.` + e.message, {stack: e.stack})
    bot.sendMessage(msg.chat.id, "⚠️ Бот немножко приболел, попробуйте позже. ").catch(e => console.error(e))
}


export async function newScheduleCommandController(msg){
    try{
        await bot.sendMessage(msg.chat.id, msg_text, {reply_markup: inline_keyboard})
    }catch (e) {
        await errorCatch(e,msg)
    }
}