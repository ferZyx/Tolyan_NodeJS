import TelegramBot from "node-telegram-bot-api"
import express from "express"
import cors from "cors"
import log from "./logging/logging.js"
import db from "./db/connection.js"
import config from "./config.js"
import {setupCommandHandlers} from "./handlers/commandHandler.js";
import setupCallbackHandlers from "./handlers/callbackHandler.js";
import setupAdminCommandHandler from "./handlers/adminCommandHandler.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import router from "./router.js";
import setupDocumentHandler from "./handlers/documentHandler.js";
import {setupUserDailyStatisticsLogging} from "./cron/userDailyStatisticsLogging.js";
import {setupDailyDataUpdate} from "./cron/dailyDataUpdate.js";
import {setupLoggingPathUpdate} from "./cron/loggingPathUpdate.js";
import setupNewChatMemberHandler from "./handlers/newChatMemberHandler.js";
import {setupAnyMessageHandler} from "./handlers/anyMessageHandler.js";
import {i18nextInit} from "./locales/init.js";
import botHealthMonitor from "./utils/botHealthMonitor.js";
import webhookTester from "./utils/webhookTester.js";

// Initialize bot based on mode (polling or webhook)
let botOptions = {};
if (config.BOT_MODE === 'webhook') {
    botOptions = { polling: false, webHook: false };
    log.info(`Bot will run in WEBHOOK mode. Webhook URL will be set after server starts.`);
} else {
    botOptions = { polling: { autoStart: true } };
    log.info(`Bot is running in POLLING mode.`);
}

export const bot = new TelegramBot(config.TG_TOKEN, botOptions);

// Bot error handlers
bot.on('polling_error', (error) => {
    log.error('Polling error occurred!', {
        error: error.message,
        code: error.code,
        stack: error.stack
    });

    // Critical error - notify admin if not in DEBUG mode
    if (!config.DEBUG) {
        bot.sendMessage(config.LOG_CHANEL_ID,
            `⚠️ POLLING ERROR!\n\nError: ${error.message}\nCode: ${error.code}\n\nBot may have stopped receiving updates!`
        ).catch(e => log.error('Failed to send polling error notification', { stack: e.stack }));
    }
});

bot.on('webhook_error', (error) => {
    log.error('Webhook error occurred!', {
        error: error.message,
        stack: error.stack
    });
});

// Track bot activity for health monitoring
bot.on('message', () => botHealthMonitor.updateActivity());
bot.on('callback_query', () => botHealthMonitor.updateActivity());

const app = express();
app.use(cors());
app.use(express.json());
app.use("/bot", router);
app.use(errorMiddleware)

const port = 5001;
const server = app.listen(port, async () => {
    log.info(`Tolyan express started at ${port} port.`);

    // Set webhook if in webhook mode
    if (config.BOT_MODE === 'webhook') {
        try {
            const webhookUrl = `${config.WEBHOOK_DOMAIN}${config.WEBHOOK_PATH}`;
            await bot.setWebHook(webhookUrl);
            log.info(`Webhook set successfully: ${webhookUrl}`);
        } catch (e) {
            log.error('Failed to set webhook!', { stack: e.stack });
            if (!config.DEBUG) {
                await bot.sendMessage(config.LOG_CHANEL_ID,
                    `⚠️ Failed to set webhook!\n\nError: ${e.message}`
                ).catch(err => log.error('Failed to send webhook error notification', { stack: err.stack }));
            }
        }
    }

    // Test webhook connectivity (works in both polling and webhook modes)
    // Небольшая задержка чтобы сервер точно был готов
    setTimeout(async () => {
        try {
            const testResults = await webhookTester.testOnStartup();

            // В режиме webhook проверяем готовность к миграции
            if (config.BOT_MODE === 'polling' && config.WEBHOOK_DOMAIN) {
                log.info('--- Checking migration readiness ---');
                const readiness = await webhookTester.checkMigrationReadiness();

                if (readiness.isReady) {
                    log.info('🎉 Bot is ready to migrate to webhook mode!');
                    log.info('💡 To migrate: set BOT_MODE=webhook in .env and restart');
                }
            }
        } catch (e) {
            log.error('Error during webhook testing', { stack: e.stack });
        }
    }, 2000); // 2 секунды задержка
});

export const userLastRequest = {};

(async () => {
    await db.connect(config.DB_URI)
        .then(() => {
            log.info("Успешное подключение к базе данных. БОТ РАБОТАЕТ КОРРЕКТНО ПО ИДЕЕ!")
        })
        .catch((e) => {
            log.error("Ошибка подключения к базе данных! ВЫЗЫВАЮ ФИКСИКОВ ВИУ ВИУ ВИУ!", {stack: e.stack})
        })

    await i18nextInit();

    await setupCommandHandlers();
    await setupAdminCommandHandler();
    await setupCallbackHandlers();
    await setupDocumentHandler()
    await setupNewChatMemberHandler()
    await setupAnyMessageHandler();

    await setupUserDailyStatisticsLogging()
    await setupDailyDataUpdate()
    await setupLoggingPathUpdate()
})().catch(async (e) => {
    console.error(e)
    await bot.sendMessage(config.LOG_CHANEL_ID, "Прозошла какая то лютая ошибка. Сработал кетч из апп.жс. Данные об ошибке в логах pm2 будут.")
});

// Node.js process error handlers
process.on('uncaughtException', async (error) => {
    log.error('Uncaught Exception!', {
        error: error.message,
        stack: error.stack
    });

    if (!config.DEBUG) {
        await bot.sendMessage(config.LOG_CHANEL_ID,
            `🚨 UNCAUGHT EXCEPTION!\n\nError: ${error.message}\n\nBot is still running but this needs attention!`
        ).catch(e => log.error('Failed to send uncaught exception notification', { stack: e.stack }));
    }
});

process.on('unhandledRejection', async (reason, promise) => {
    log.error('Unhandled Rejection!', {
        reason: reason,
        promise: promise
    });

    if (!config.DEBUG) {
        await bot.sendMessage(config.LOG_CHANEL_ID,
            `🚨 UNHANDLED REJECTION!\n\nReason: ${reason}\n\nBot is still running but this needs attention!`
        ).catch(e => log.error('Failed to send unhandled rejection notification', { stack: e.stack }));
    }
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    log.info(`${signal} received. Starting graceful shutdown...`);

    try {
        // Stop accepting new requests
        server.close(() => {
            log.info('HTTP server closed');
        });

        // Remove webhook if in webhook mode
        if (config.BOT_MODE === 'webhook') {
            await bot.deleteWebHook();
            log.info('Webhook removed');
        } else {
            // Stop polling
            await bot.stopPolling();
            log.info('Polling stopped');
        }

        // Close database connection
        await db.connection.close();
        log.info('Database connection closed');

        log.info('Graceful shutdown completed');
        process.exit(0);
    } catch (e) {
        log.error('Error during graceful shutdown', { stack: e.stack });
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));



