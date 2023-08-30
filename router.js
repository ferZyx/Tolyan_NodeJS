import {Router} from "express";
import cors from "cors";
import axios from "axios";
import log from "./logging/logging.js"
import groupService from "./services/groupService.js";
import userService from "./services/userService.js";
import scheduleService from "./services/scheduleService.js";

const router = new Router()

router.get('/get_user_schedule', cors(), async (req, res) => {
    try {
        const userId = req.query.userId
        if (!userId) {
            return res.status(400).json("Айдишник забыл, брат")
        }
        const user = await userService.getUserById(userId)
        const group = await groupService.getById(user.group)

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
                schedule: schedule.data,
                updatedAt: updateAt.getTime(),
                group,
                user
            })
        }

    } catch (e) {
        log.error("Ошибка при получении ВЕБ АПП расписания", {stack: e.stack})
        return res.status(500).json("Непредвиденная ошибка")
    }


})

export default router