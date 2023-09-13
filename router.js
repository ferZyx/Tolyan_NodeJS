import {Router} from "express";
import axios from "axios";
import log from "./logging/logging.js"
import groupService from "./services/groupService.js";
import userService from "./services/userService.js";
import scheduleService from "./services/scheduleService.js";
import LogService from "./services/logService.js";
import teacherService from "./services/teacherService.js";
import teacherScheduleService from "./services/teacherScheduleService.js";

const router = new Router()

router.post("/log", async (req,res) => {
    const data = req.body
    log.warn(JSON.stringify(data))
    return res.json('logged')
})

router.get('/get_user_schedule', async (req, res) => {
    const userId = req.query.userId
    log.info(`User ${userId} used a WebApp!`)
    if (!userId || isNaN(userId)) {
        return res.status(400).json("Айдишник забыл, брат. Или он некорректный")
    }
    const user = await userService.getUserById(userId)
    if (!user) {
        return res.status(404).json("Пользователь не найден")
    }

    const data = {scheduleType: user.scheduleType ? user.scheduleType : 'student'}

    const group = await groupService.getById(user.group)
    if (group) {
        const groupId = group.id;
        const language = group.language;
        try {
            const response = await axios.get(`https://api.tolyan.me/schedule/get_schedule_by_groupId/${groupId}/${language}`)

            data.studentSchedule = {
                schedule:response.data,
                updatedAt: Date.now(),
                group,
                isNew:true
            }
        } catch (e) {
            const schedule = await scheduleService.getByGroupId(groupId)
            if (schedule) {
                const updateAt = new Date(schedule.updatedAt)
                data.studentSchedule = {
                    schedule: schedule.data,
                    updatedAt: updateAt.getTime(),
                    group,
                    isNew:false
                }
            }

        }
    }

    const teacher = await teacherService.getById(user.teacher)
    if (teacher) {
        const teacherId = teacher.id;
        try {
            const response = await axios.get(`https://api.tolyan.me/teacherSchedule/get_teacher_schedule/${teacherId}`)

            data.teacherSchedule = {
                schedule:response.data,
                updatedAt: Date.now(),
                teacher,
                isNew:true
            }
        } catch (e) {
            const schedule = await teacherScheduleService.getByTeacherId(teacherId)
            if (schedule) {
                const updateAt = new Date(schedule.updatedAt)

                data.teacherSchedule = {
                    schedule:schedule.data,
                    updatedAt: updateAt,
                    teacher,
                    isNew:false
                }
            }

        }
    }

    return res.json(data)
})

router.get('/get_user_activity_logs', async (req, res) => {
    const desiredLogLevels = req.query.levels ? req.query.levels.split(',') : [];
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const userId = parseInt(req.query.userId);
    const skip = (page - 1) * limit;

    const query = desiredLogLevels.length > 0 ? {level: {$in: desiredLogLevels}} : {};

    if (userId){
        query['meta.userId'] = userId
    }
    const totalDocuments = await LogService.getLogsCount(query)
    const documents = await LogService.getLogs(query, skip, limit)

    return res.json({
        page,
        limit,
        totalPages: Math.ceil(totalDocuments / limit),
        documents,
        desiredLogLevels
    });
})

export default router