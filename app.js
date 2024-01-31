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

export const bot = new TelegramBot(config.TG_TOKEN, {
    polling: {
        autoStart: true
    }
});

const app = express();
const cors = require('cors');
const corsOptions ={
    origin:'http://localhost:3000',
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
app.use(cors(corsOptions));
app.use(express.json());
app.use("/bot", router);
app.use(errorMiddleware)

const port = 5001;
app.listen(port, () => log.info(`Tolyan express started at ${port} port.`));

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



