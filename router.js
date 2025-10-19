import {Router} from "express";
import axios from "axios";
import log from "./logging/logging.js"
import groupService from "./services/groupService.js";
import userService from "./services/userService.js";
import scheduleService from "./services/scheduleService.js";
import LogService from "./services/logService.js";
import teacherService from "./services/teacherService.js";
import teacherScheduleService from "./services/teacherScheduleService.js";
import config from "./config.js";
import botHealthMonitor from "./utils/botHealthMonitor.js";
import {bot} from "./app.js";

const router = new Router()

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        const healthStatus = await botHealthMonitor.getStatus();
        const statusCode = healthStatus.healthy ? 200 : 503;

        return res.status(statusCode).json({
            status: healthStatus.healthy ? 'healthy' : 'unhealthy',
            mode: config.BOT_MODE,
            ...healthStatus
        });
    } catch (e) {
        log.error('Error in health check endpoint', { stack: e.stack });
        return res.status(500).json({
            status: 'error',
            error: e.message
        });
    }
});

// Webhook endpoint (works in both polling and webhook modes)
router.post('/webhook', async (req, res) => {
    try {
        const update = req.body;

        // Log webhook receipt
        log.info('Webhook update received', {
            mode: config.BOT_MODE,
            updateId: update.update_id,
            hasMessage: !!update.message,
            hasCallbackQuery: !!update.callback_query
        });

        // Update bot activity
        botHealthMonitor.updateActivity();

        // Process the update
        await bot.processUpdate(update);

        return res.sendStatus(200);
    } catch (e) {
        log.error('Error processing webhook update', { stack: e.stack, update: req.body });
        return res.sendStatus(500);
    }
});

// Test webhook endpoint - для тестирования доступности webhook
router.post('/webhook/test', async (req, res) => {
    try {
        const testData = req.body;

        log.info('Test webhook call received', {
            mode: config.BOT_MODE,
            testData,
            timestamp: new Date().toISOString()
        });

        return res.status(200).json({
            success: true,
            mode: config.BOT_MODE,
            message: 'Test webhook endpoint is working',
            timestamp: new Date().toISOString(),
            receivedData: testData
        });
    } catch (e) {
        log.error('Error in test webhook endpoint', { stack: e.stack });
        return res.status(500).json({
            success: false,
            error: e.message
        });
    }
});

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
        return res.json({
            studentSchedule:null,
            teacherSchedule:null
        })
    }

    const data = {scheduleType: user.scheduleType ?? 'student'}

    const group = await groupService.getById(user.group)
    if (group) {
        const groupId = group.id;
        const language = group.language;
        try {
            const response = await axios.get(`${config.KSU_HELPER_URL}/epxress/api/schedule/get_schedule_by_groupId/${groupId}/${language}`, {timeout:10000})

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
    }else{
        data.studentSchedule = null
    }

    const teacher = await teacherService.getById(user.teacher)
    if (teacher) {
        const teacherId = teacher.id;
        try {
            const response = await axios.get(`${config.KSU_HELPER_URL}/express/api/teacherSchedule/get_teacher_schedule/${teacherId}`)

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
    }else{
        data.teacherSchedule = null
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