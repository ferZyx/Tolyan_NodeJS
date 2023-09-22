import {bot} from "../app.js";
import {startCommandController} from "../controllers/commands/startCommandController.js";
import {scheduleCommandController} from "../controllers/commands/scheduleCommandController.js";
import {profileCommandController} from "../controllers/commands/profileCommandController.js";
import {helpCommandController} from "../controllers/commands/helpCommandController.js";
import {newsCommandController} from "../controllers/commands/newsCommandController.js";
import {donateCommandController} from "../controllers/commands/donateCommandController.js";
import {teacherScheduleCommandController} from "../controllers/commands/teacherScheduleCommandController.js";
import {groupScheduleCommandController} from "../controllers/commands/groupScheduleCommandController.js";
import {newScheduleCommandController} from "../controllers/commands/newScheduleCommandController.js";


export function setupCommandHandlers() {
    bot.onText(/^\/start/i, startCommandController);

    bot.onText(/^🗒 Новое расписание/i, newScheduleCommandController);
    bot.onText(/^\/new$/i, newScheduleCommandController);
    bot.onText(/^\/new (.+)/i, newScheduleCommandController);

    bot.onText(/^\/schedule/i, scheduleCommandController);
    bot.onText(/^расписание/i, scheduleCommandController);

    bot.onText(/^🗓 Расписание преподавателя/i, teacherScheduleCommandController);

    bot.onText(/^🗓 Расписание студента/i, groupScheduleCommandController);

    bot.onText(/^профиль/i, profileCommandController);

    bot.onText(/^\/help/i, helpCommandController)
    bot.onText(/^💡 Помощь/i, helpCommandController)

    bot.onText(/^\/news/i, newsCommandController)
    bot.onText(/^📢 Новости/i, newsCommandController)

    bot.onText(/^\/donate/i, donateCommandController)

    // bot.onText(/^Г/i, searchGroupCommandController)
}
