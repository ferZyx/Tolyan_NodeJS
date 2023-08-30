import {Router} from "express";
import axios from "axios";
import log from "./logging/logging.js"
import groupService from "./services/groupService.js";
import userService from "./services/userService.js";
import scheduleService from "./services/scheduleService.js";

const router = new Router()

router.get('/get_user_schedule', async (req, res) => {
    const userId = req.query.userId
    if (!userId || isNaN(userId)) {
        log.error(`Веб апп получил некорректный userId:${userId}`)
        return res.status(400).json("Айдишник забыл, брат. Или он некорректный")
    }
    const user = await userService.getUserById(userId)
    if (!user){
        log.error(`Веб апп получил некорректный userId:${userId}\nТакого юзера в бд нет!`)
        return res.status(404).json("Пользователь не найден")
    }
    const group = await groupService.getById(user.group)
    if (!group){
        log.error(`Веб апп получил некорректный userId:${userId}\nУ такого юзера в бд нет группы!`)
        return res.status(404).json("Пользователь не зарегистрирован")
    }
    const groupId = group.id;
    const language = group.language;

    try {
        const response = await axios.get(`http://79.133.182.125:5000/api/schedule/get_schedule_by_groupId/${groupId}/${language}`)

        return res.json({
            schedule: response.data,
            updatedAt: Date.now(),
            group,
            user
        })
    } catch (e) {
        const schedule = await scheduleService.getByGroupId(groupId)
        if (!schedule) {
            return res.status(404).json("Резервное расписание не найдено в базе данных.")
        }
        const updateAt = new Date(schedule.updatedAt)
            return res.json({
                schedule:schedule.data,
                updatedAt:updateAt.getTime(),
                group,
                user
            })
        }
})

router.get('/get_user_activity_logs', async (req, res) => {

})




export default router