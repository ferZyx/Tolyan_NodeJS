import {bot} from "../app.js";
import log from "../logging/logging.js";
import groupService from "../services/groupService.js";
import userService from "../services/userService.js";
import ScheduleController from "../controllers/ScheduleController.js";
import fs from "fs/promises"
import UserActivityService from "../services/userActivityService.js";
import userActivityService from "../services/userActivityService.js";
import userRegistrationStatService from "../services/userRegistrationStatService.js";
import {isAdminMiddleware} from "../middlewares/bot/isAdminMiddleware.js";
import {updateFacultiesCommandController} from "../controllers/commands/adminCommands/updateFaculties.js";
import {updateProgramsCommandController} from "../controllers/commands/adminCommands/updatePrograms.js";
import {updateGroupsCommandController} from "../controllers/commands/adminCommands/updateGroups.js";
import {updateProfilesCommandController} from "../controllers/commands/adminCommands/updateProfiles.js";
import blackListService from "../services/blackListService.js";
import {updateDepartmentsCommandController} from "../controllers/commands/adminCommands/updateDepartments.js";
import {updateTeachersCommandController} from "../controllers/commands/adminCommands/updateTeachers.js";
import {
  inactiveSpamAdminCommandController
} from "../controllers/commands/adminCommands/inactiveSpamAdminCommandController.js";
import {piarAdminCommandController} from "../controllers/commands/adminCommands/piarAdminCommandController.js";
import axios from "axios";
import {getUserCommandController} from "../controllers/commands/adminCommands/getUser.js";

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export default function setupAdminCommandHandler() {
  bot.onText(/^\/updateFaculties/, async (msg) => {
    await isAdminMiddleware(msg, async () => {
      let hard = false
      if (msg.text.includes("hard")) {
        hard = true
      }
      await updateFacultiesCommandController(hard)
    })
  })

  bot.onText(/^\/updatePrograms/, async (msg) => {
    await isAdminMiddleware(msg, async () => {
      let hard = false
      if (msg.text.includes("hard")) {
        hard = true
      }
      await updateProgramsCommandController(hard)
    })
  })

  bot.onText(/^\/updateGroups/, async (msg) => {
    await isAdminMiddleware(msg, async () => {
      let hard = false
      if (msg.text.includes("hard")) {
        hard = true
      }
      await updateGroupsCommandController(hard)
    })
  })

  bot.onText(/^\/updateProfiles/, async (msg) => {
    await isAdminMiddleware(msg, async () => {
      let hard = false
      if (msg.text.includes("hard")) {
        hard = true
      }
      await updateProfilesCommandController(hard)
    })
  })

  bot.onText(/^\/updateDepartments/, async (msg) => {
    await isAdminMiddleware(msg, async () => {
      let hard = false
      if (msg.text.includes("hard")) {
        hard = true
      }
      await updateDepartmentsCommandController(hard)
    })
  })

  bot.onText(/^\/updateTeachers/, async (msg) => {
    await isAdminMiddleware(msg, async () => {
      let hard = false
      if (msg.text.includes("hard")) {
        hard = true
      }
      await updateTeachersCommandController(hard)
    })

  })


  bot.onText(/^\/info$/, async (msg) => {
    if (!await userService.isAdmin(msg.from.id)) {
      return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
    }
    log.warn("Тестовый лог!")
    await bot.sendMessage(msg.chat.id, JSON.stringify(msg, null, 2))
  })

  bot.onText(/^\/test$/, async (msg) => {
    if (!await userService.isAdmin(msg.from.id)) {
      return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
    }
    try {
      await axios.get("https://schedule.ksu.kz")
    } catch (e) {
      console.log(e)
      log.error("Ошибочка в /test", {stack: e.stack})
    }
  })

  bot.onText(/\/stat/, async (msg) => {
    if (!await userService.isAdmin(msg.from.id)) {
      return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
    }
    try {
      // Юзеров за сегодня
      const activeUsersToday = await userActivityService.getTodayUserCount()
      const registeredUsersToday = await userRegistrationStatService.getTodayRegisteredUserCount()

      let msg_text = 'Статистика ежедневного онлайна: \n' +
        `Сегодня: ${activeUsersToday}\n`
      const {weakUserActivity, weakUserCount} = await UserActivityService.getWeakUserActivity()
      for (const doc of weakUserActivity) {
        const date = new Date(doc.createdAt); // Преобразуем строку в объект Date
        const day = date.getDate().toString().padStart(2, '0'); // Извлекаем день и форматируем
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Извлекаем месяц и форматируем

        msg_text += `${day}.${month}: ${doc.userActivity}\n`
      }
      msg_text += `Всего уникальных пользователей за неделю: ${weakUserCount}\n\n`

      msg_text += 'Статистика ежедневных регистраций: \n' +
        `Сегодня: ${registeredUsersToday}\n`
      const {
        weakRegisteredUserCount,
        weakRegistrationStat
      } = await userRegistrationStatService.getWeakRegistrationStat()
      for (const doc of weakRegistrationStat) {
        const date = new Date(doc.createdAt); // Преобразуем строку в объект Date
        const day = date.getDate().toString().padStart(2, '0'); // Извлекаем день и форматируем
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Извлекаем месяц и форматируем

        msg_text += `${day}.${month}: ${doc.registeredUsers}\n`
      }
      msg_text += `Всего зареганных пользователей за неделю: ${weakRegisteredUserCount}`

      await bot.sendMessage(msg.chat.id, msg_text)
    } catch (e) {
      log.error("Ошибочка в /stat", {stack: e.stack})
    }
  })

  bot.onText(/^\/users$/, async (msg) => {
    try {
      if (!await userService.isAdmin(msg.from.id)) {
        return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
      }
      const userCount = await userService.countDocuments()
      await bot.sendMessage(msg.chat.id, `В базе данных Толяна ${userCount} пользователей.`)
    } catch (e) {
      log.error({stack: e.stack})
    }
  })

  bot.onText(/^\/group_stat$/, async (msg) => {
    try {
      if (!await userService.isAdmin(msg.from.id)) {
        return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
      }
      await bot.sendMessage(msg.chat.id, "started")
      const startTime = Date.now()

      let group_stat = []

      const groups = await groupService.getAll()
      const users = await userService.getAll()

      for (const group of groups) {
        const our_users = users.filter(user => user.group === group.id)
        group_stat.push({
          id: group.id,
          name: group.name,
          students: group.studentCount,
          our_users: our_users.length,
          not_our_users: group.studentCount - our_users.length,
          ratio: our_users.length / group.studentCount
        })
      }

      const sortedGroupStat = group_stat.slice().sort((a, b) => b.not_our_users - a.not_our_users);

      const activeGroups = sortedGroupStat.filter(group => group.ratio > 0).slice(0, 20)

      let msg_text = 'Потенциальные юзеры: \n'
      for (const group of activeGroups) {
        msg_text += `ID: ${group.id}, All: ${group.students} | Не наши: ${group.not_our_users}\n` +
          `/get_users_by_group${group.id}\n`
      }

      await fs.writeFile("./temp/group_stat.json", JSON.stringify(sortedGroupStat, null, 3))
      const endTime = Date.now()
      await bot.sendDocument(msg.chat.id, './temp/group_stat.json', {caption: `Action time: ${(endTime - startTime) / 1000} сек.\n}`})
      await bot.sendMessage(msg.chat.id, msg_text)
    } catch (e) {
      console.log(e)
      log.error("error", {stack: e.stack})
    }
  })

  bot.onText(/^\/get_schedule (\w+)$/i, async (msg, match) => {
    try {
      if (!await userService.isAdmin(msg.from.id)) {
        return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
      }
      const groupId = match[1];

      const answer = await bot.sendMessage(msg.chat.id, `Получаем расписание группы: ${groupId}`)
      const Group = await groupService.getById(groupId)
      if (!Group) {
        return bot.editMessageText("Нет такой группы. ", {
          chat_id: answer.chat.id, message_id: answer.message_id
        })
      }

      const call = {
        data: `schedule|${Group.language}|${groupId}|${ScheduleController.getCurrentDayNumber()}`,
        message: answer
      }
      await ScheduleController.getScheduleMenu(call)
    } catch (e) {
      log.error({stack: e.stack})
    }

  });

  bot.onText(/^\/get_reserved_schedule (\w+)$/i, async (msg, match) => {
    try {
      if (!await userService.isAdmin(msg.from.id)) {
        return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
      }
      const groupId = match[1];

      const answer = await bot.sendMessage(msg.chat.id, `Получаем расписание группы: ${groupId}`)
      const Group = await groupService.getById(groupId)
      if (!Group) {
        return bot.editMessageText("Нет такой группы. ", {
          chat_id: answer.chat.id, message_id: answer.message_id
        })
      }

      const call = {
        data: `schedule|${Group.language}|${groupId}|${ScheduleController.getCurrentDayNumber()}`,
        message: answer
      }
      await ScheduleController.getReservedSchedule(call, groupId)
    } catch (e) {
      log.error({stack: e.stack})
    }

  });

  bot.onText(/^\/get_user/i, getUserCommandController);

  bot.onText(/^\/ignoreLogs/i, async (msg) => {
    try {
      if (!await userService.isAdmin(msg.from.id)) {
        return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
      }
      const userId = parseFloat(msg.text.replace('/ignoreLogs', ''))
      if (isNaN(userId)) {
        return await bot.sendMessage(msg.chat.id, "UserId is NaN")
      }

      await blackListService.addToBlackList(userId)

      await bot.sendMessage(msg.chat.id, "Added to black list")
    } catch (e) {
      log.error("Ошибочка при /ignoreLogs", {stack: e.stack})
    }
  });


  bot.onText(/^\/get_users_by_group/i, async (msg) => {
    try {
      if (!await userService.isAdmin(msg.from.id)) {
        return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
      }
      const groupId = parseFloat(msg.text.replace('/get_users_by_group', ''))
      if (isNaN(groupId)) {
        return await bot.sendMessage(msg.chat.id, "UserId is NaN")
      }

      const users = await userService.getUsersByGroupId(groupId)

      let msg_text = `Group ${groupId} users: \n`
      for (const user of users) {
        msg_text += `/get_user${user.userId}\n`
      }

      await bot.sendMessage(msg.chat.id, msg_text)
    } catch (e) {
      log.error("Ошибочка при /get_users_by_group", {stack: e.stack})
    }

  });


  bot.onText(/^\/get_logs/i, async (msg) => {
    try {
      if (!await userService.isAdmin(msg.from.id)) {
        return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
      }

      await bot.sendDocument(msg.chat.id, './logs.log')
    } catch (e) {
      log.error("Ошибочка при /get_logs", {stack: e.stack})
    }

  });

  bot.onText(/^\/sms/i, async (msg) => {
    try {
      if (!await userService.isAdmin(msg.from.id)) {
        return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
      }
      const split_data = msg.text.split(" ")
      if (split_data.length < 3) {
        return await bot.sendMessage(msg.chat.id, "После команды должен быть 2 параметра!")
      }
      const userId = split_data[1]
      if (isNaN(parseFloat(userId))) {
        return await bot.sendMessage(msg.chat.id, "Параметр userId is NaN")
      }
      const msg_text = msg.text.replace(userId, '').replace('/sms ', '')

      await bot.sendMessage(userId, msg_text)
      await bot.sendMessage(msg.chat.id, "Отправлено: \n" + msg_text)
    } catch (e) {
      log.error("Ошибочка при /sms", {stack: e.stack})
    }

  });

  bot.onText(/^\/inactiveSpam/i, inactiveSpamAdminCommandController);
  bot.onText(/^\/piar/i, piarAdminCommandController);


  bot.onText(/^\/spam/i, async (msg) => {
    let stop = false
    bot.onText(/\/stop/, async (msg) => {
      await bot.sendMessage(msg.chat.id, "Остановил спамить")
      stop = true
    })
    try {
      if (!await userService.isAdmin(msg.from.id)) {
        return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
      }
      const split_data = msg.text.split(" ")
      if (split_data.length < 2) {
        return await bot.sendMessage(msg.chat.id, "После команды должен быть текст!")
      }
      const msg_text = msg.text.replace("/spam ", "")

      const users = await userService.getAll()

      await bot.sendMessage(msg.chat.id, 'Начал спамить. /stop чтобы принудительно завершить спам\n' + msg_text, {disable_web_page_preview: true})
      const startTime = Date.now()

      for (const user of users) {
        if (stop) {
          break
        }
        await sleep(2000)
        let status = true
        try {
          await bot.sendMessage(user.userId, msg_text, {disable_web_page_preview: true})
          log.info(`User ${user.userId} получил spm message`)
        } catch (e) {
          status = false
          log.info(`User ${user.userId} не получил спам сообщение.`, {stack: e.stack})
        }
      }

      await bot.sendMessage(msg.chat.id, `Done. Action time = ${Math.floor((Date.now() - startTime) / 1000)}`)

    } catch (e) {
      log.error("Ошибочка при /spam", {stack: e.stack})
    }

  });

  bot.onText(/^\/get_group (\w+)/i, async (msg, match) => {
    try {
      if (!await userService.isAdmin(msg.from.id)) {
        return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
      }
      const groupId = match[1];

      const group = await groupService.getById(groupId)
      await bot.sendMessage(msg.chat.id, JSON.stringify(group, null, 4))
    } catch (e) {
      log.error({stack: e.stack})
    }
  });

  bot.onText(/^\/restart/i, async (msg) => {
    try {
      if (!await userService.isAdmin(msg.from.id)) {
        return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
      }

      await bot.sendMessage(msg.chat.id, "Ща всё будет")

      await axios.get('http://209.38.209.184:5000/express/api/browser/restart_browser')
    } catch (e) {
      log.error({stack: e.stack})
    }
  });

  bot.onText(/^\/get_callback/i, async (msg) => {
    try {
      if (!await userService.isAdmin(msg.from.id)) {
        return await bot.sendMessage(msg.chat.id, "У вас нет доступа к этой прекрасной команде!")
      }
      if (msg.text.split(" ") < 2) {
        return await bot.sendMessage(msg.chat.id, "После команды должно быть значение колбека")
      }
      const callback_data = msg.text.replace('/get_callback ', '')
      await bot.sendMessage(msg.chat.id, "here is your callback: " + callback_data, {
        reply_markup: {inline_keyboard: [[{text: callback_data, callback_data}]]}
      })
    } catch (e) {
      log.error({stack: e.stack})
    }
  })

  bot.onText(/^\/ahelp/i, async (msg) => {
    const msg_text = '/updateFaculties [isHard] \n' +
      '/updatePrograms [isHard] \n' +
      '/updateGroups [isHard] \n' +
      '/updateProfiles [isHard] \n' +
      '/updateDepartments [isHard] \n' +
      '/updateTeachers [isHard] \n' +
      '/info \n' +
      '/stat \n' +
      '/users \n' +
      '/group_stat \n' +
      '/get_schedule [groupId] \n' +
      '/get_reserved_schedule [groupId]\n' +
      '/get_user [userId] \n' +
      '/get_logs \n' +
      '/ignoreLogs [userId] \n' +
      '/get_users_by_group [groupId] \n' +
      '/get_logs (Осторожно. скидывает фулл лог за всю историю) \n' +
      '/sms [userId] [text] \n' +
      '/inactiveSpam [text]\n' +
      '/piar [text]\n' +
      '/spam [text] \n' +
      '/stop (стоп спамить) \n' +
      '/get_group \n' +
      '/restart (browser restart) \n' +
      '/get_callback [callbackName] \n'
    await bot.sendMessage(msg.chat.id, msg_text)
  });
}