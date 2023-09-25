import log from "../../logging/logging.js";
import {startCommandController} from "../../controllers/commands/startCommandController.js";

export async function queryValidationErrorController(bot, call) {
    try {
        log.error(`User ${call.message.chat.id} used an incorrect callback: ${call.data}. Данные об ошибке в метаданных. Делаю редирект на главную`, {
            call
        })
        await startCommandController(call.message)
    } catch (e) {
        log.error("УЛЬТРА МЕГА ВАЖНО! ОШИБКА ПРИ ПОПЫТКЕ ОБРАБОТАТЬ ОШИБКУ! queryValidationErrorController." + e.message,
            {call, stack: e.stack})
    }
}