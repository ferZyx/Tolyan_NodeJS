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
import {safeHandler} from "../utils/safeHandler.js";

export function setupCommandHandlers() {
    bot.onText(/^\/start/i, safeHandler(startCommandController, 'start'));

    bot.onText(/^🗒 Новое расписание/i, safeHandler(newScheduleCommandController, 'newSchedule'));
    bot.onText(/^🗒 Жаңа кесте/i, safeHandler(newScheduleCommandController, 'newSchedule'));
    bot.onText(/^\/new$/i, safeHandler(newScheduleCommandController, 'newSchedule'));
    bot.onText(/^\/new (.+)/i, safeHandler(newScheduleCommandController, 'newSchedule'));

    bot.onText(/^\/schedule/i, safeHandler(scheduleCommandController, 'schedule'));
    bot.onText(/^расписание/i, safeHandler(scheduleCommandController, 'schedule'));

    bot.onText(/^🗓 Расписание преподавателя/i, safeHandler(teacherScheduleCommandController, 'teacherSchedule'));
    bot.onText(/^🗓 Оқытушының кестесі/i, safeHandler(teacherScheduleCommandController, 'teacherSchedule'));

    bot.onText(/^🗓 Расписание студента/i, safeHandler(groupScheduleCommandController, 'groupSchedule'));
    bot.onText(/^🗓 Студенттің кестесі/i, safeHandler(groupScheduleCommandController, 'groupSchedule'));

    bot.onText(/^профиль/i, safeHandler(profileCommandController, 'profile'));

    bot.onText(/^\/help/i, safeHandler(helpCommandController, 'help'))
    bot.onText(/^💡 Помощь/i, safeHandler(helpCommandController, 'help'))
    bot.onText(/^💡 Көмек/i, safeHandler(helpCommandController, 'help'))

    bot.onText(/^\/news/i, safeHandler(newsCommandController, 'news'))
    bot.onText(/^📢 Новости/i, safeHandler(newsCommandController, 'news'))
    bot.onText(/^📢 Жаңалықтар/i, safeHandler(newsCommandController, 'news'))

    bot.onText(/^\/donate/i, safeHandler(donateCommandController, 'donate'))

    bot.onText(/^\/remove/i, safeHandler(removeKeyboardCommandController, 'removeKeyboard'))

    bot.onText(/^Г (.+)/i, safeHandler(searchGroupCommandController, 'searchGroup'))
    bot.onText(/^Т (.+)/i, safeHandler(searchGroupCommandController, 'searchGroup'))
    bot.onText(/^Г$/i, safeHandler(searchGroupCommandController, 'searchGroup'))
    bot.onText(/^Т$/i, safeHandler(searchGroupCommandController, 'searchGroup'))
    bot.onText(/^Группа/i, safeHandler(searchGroupCommandController, 'searchGroup'))
    bot.onText(/^Тобы/i, safeHandler(searchGroupCommandController, 'searchGroup'))

    bot.onText(/^П (.+)/i, safeHandler(searchTeacherCommandController, 'searchTeacher'))
    bot.onText(/^О (.+)/i, safeHandler(searchTeacherCommandController, 'searchTeacher'))
    bot.onText(/^П$/i, safeHandler(searchTeacherCommandController, 'searchTeacher'))
    bot.onText(/^О$/i, safeHandler(searchTeacherCommandController, 'searchTeacher'))
    bot.onText(/^Преподаватель/i, safeHandler(searchTeacherCommandController, 'searchTeacher'))
    bot.onText(/^Оқытушы/i, safeHandler(searchTeacherCommandController, 'searchTeacher'))

    bot.onText(/^\/search/i, safeHandler(searchHelpCommandController, 'searchHelp'))
    bot.onText(/^Поиск/i, safeHandler(searchHelpCommandController, 'searchHelp'))
}
