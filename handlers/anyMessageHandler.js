import blackListService from "../services/blackListService.js";
import log from "../logging/logging.js";
import {bot} from "../app.js";


export function setupAnyMessageHandler() {
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
