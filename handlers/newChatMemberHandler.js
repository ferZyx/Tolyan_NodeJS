import blackListService from "../services/blackListService.js";
import log from "../logging/logging.js";
import config from "../config.js";
import UserService from "../services/userService.js";

export default async function setupNewChatMemberHandler(bot) {
    bot.on('new_chat_members', async (msg) => {
        try{
            const newMembers = msg.new_chat_members;

            if (await UserService.isAdmin(msg.from.id)){
                return
            }

            for (const member of newMembers) {
                if (+member.id === +config.BOT_ID) {
                    const isBlackListed = await blackListService.isBlackListed(msg.chat.id)
                    if (isBlackListed) {
                        try{
                            log.warn("Добавили в забаненный канал! Сваливаю оттуда!")
                            await bot.leaveChat(msg.chat.id)
                        }catch (e) {
                            log.error("Ошибка при попытке выхода из забаненного канала!(" + e.message, {stack:e.stack})
                        }
                    } else {
                        log.warn("Добавили в группу какую то! ВИУ ВИУ ВИУ" + msg.chat.id)
                    }
                    break;
                }
            }
        }catch (e) {
            log.error("Важно, ошибка в newChatMemberHandler. Никто не пострадал. " + e.message, {stack:e.stack})
        }
    });

}
