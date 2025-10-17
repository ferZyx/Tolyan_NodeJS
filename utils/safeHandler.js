import log from "../logging/logging.js";
import config from "../config.js";
import {bot} from "../app.js";

/**
 * Wraps bot command/callback handlers with error handling
 * Prevents uncaught errors from crashing the bot
 * @param {Function} handler - The handler function to wrap
 * @param {string} handlerName - Name of the handler for logging
 * @returns {Function} - Wrapped handler
 */
export function safeHandler(handler, handlerName = 'unknown') {
    return async (...args) => {
        try {
            await handler(...args);
        } catch (error) {
            // Extract user ID for logging
            let userId = 'unknown';
            if (args[0]?.chat?.id) {
                userId = args[0].chat.id;
            } else if (args[0]?.message?.chat?.id) {
                userId = args[0].message.chat.id;
            }

            log.error(`Error in ${handlerName} handler`, {
                userId,
                error: error.message,
                stack: error.stack,
                handlerName
            });

            // Notify admin in production
            if (!config.DEBUG) {
                bot.sendMessage(config.LOG_CHANEL_ID,
                    `⚠️ Error in handler: ${handlerName}\n\nUser: ${userId}\nError: ${error.message}`
                ).catch(e => log.error('Failed to send error notification', { stack: e.stack }));
            }

            // Try to inform user
            try {
                const chatId = args[0]?.chat?.id || args[0]?.message?.chat?.id;
                if (chatId) {
                    await bot.sendMessage(chatId,
                        'Произошла ошибка при обработке команды. Попробуйте еще раз или обратитесь к администратору.'
                    );
                }
            } catch (e) {
                log.error('Failed to send error message to user', { stack: e.stack });
            }
        }
    };
}

/**
 * Safe wrapper for callback query handlers
 * Similar to safeHandler but specifically for callback queries
 */
export function safeCallbackHandler(handler, handlerName = 'unknown') {
    return async (call) => {
        try {
            await handler(call);
        } catch (error) {
            const userId = call?.message?.chat?.id || 'unknown';

            log.error(`Error in ${handlerName} callback handler`, {
                userId,
                error: error.message,
                stack: error.stack,
                data: call?.data,
                handlerName
            });

            // Notify admin in production
            if (!config.DEBUG) {
                bot.sendMessage(config.LOG_CHANEL_ID,
                    `⚠️ Error in callback: ${handlerName}\n\nUser: ${userId}\nCallback: ${call?.data}\nError: ${error.message}`
                ).catch(e => log.error('Failed to send error notification', { stack: e.stack }));
            }

            // Try to answer callback query to remove loading state
            try {
                if (call?.id) {
                    await bot.answerCallbackQuery(call.id, {
                        text: 'Произошла ошибка. Попробуйте еще раз.',
                        show_alert: true
                    });
                }
            } catch (e) {
                log.error('Failed to answer callback query', { stack: e.stack });
            }
        }
    };
}
