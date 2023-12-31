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
import {searchGroupCommandController} from "../controllers/commands/searchGroupCommandController.js";
import {searchTeacherCommandController} from "../controllers/commands/searchTeacherCommandController.js";
import {removeKeyboardCommandController} from "../controllers/commands/removeKeyboardCommandController.js";
import {searchHelpCommandController} from "../controllers/commands/searchHelpCommandController.js";

export function setupCommandHandlers() {
    bot.onText(/^\/start/i, startCommandController);

    bot.onText(/^🗒 Новое расписание/i, newScheduleCommandController);
    bot.onText(/^🗒 Жаңа кесте/i, newScheduleCommandController);
    bot.onText(/^\/new$/i, newScheduleCommandController);
    bot.onText(/^\/new (.+)/i, newScheduleCommandController);

    bot.onText(/^\/schedule/i, scheduleCommandController);
    bot.onText(/^расписание/i, scheduleCommandController);

    bot.onText(/^🗓 Расписание преподавателя/i, teacherScheduleCommandController);
    bot.onText(/^🗓 Оқытушының кестесі/i, teacherScheduleCommandController);

    bot.onText(/^🗓 Расписание студента/i, groupScheduleCommandController);
    bot.onText(/^🗓 Студенттің кестесі/i, groupScheduleCommandController);

    bot.onText(/^профиль/i, profileCommandController);

    bot.onText(/^\/help/i, helpCommandController)
    bot.onText(/^💡 Помощь/i, helpCommandController)
    bot.onText(/^💡 Көмек/i, helpCommandController)

    bot.onText(/^\/news/i, newsCommandController)
    bot.onText(/^📢 Новости/i, newsCommandController)
    bot.onText(/^📢 Жаңалықтар/i, newsCommandController)

    bot.onText(/^\/donate/i, donateCommandController)

    bot.onText(/^\/remove/i, removeKeyboardCommandController)

    bot.onText(/^Г (.+)/i, searchGroupCommandController)
    bot.onText(/^Т (.+)/i, searchGroupCommandController)
    bot.onText(/^Г$/i, searchGroupCommandController)
    bot.onText(/^Т$/i, searchGroupCommandController)
    bot.onText(/^Группа/i, searchGroupCommandController)
    bot.onText(/^Тобы/i, searchGroupCommandController)

    bot.onText(/^П (.+)/i, searchTeacherCommandController)
    bot.onText(/^О (.+)/i, searchTeacherCommandController)
    bot.onText(/^П$/i, searchTeacherCommandController)
    bot.onText(/^О$/i, searchTeacherCommandController)
    bot.onText(/^Преподаватель/i, searchTeacherCommandController)
    bot.onText(/^Оқытушы/i, searchTeacherCommandController)

    bot.onText(/^\/search/i, searchHelpCommandController)
    bot.onText(/^Поиск/i, searchHelpCommandController)
}
