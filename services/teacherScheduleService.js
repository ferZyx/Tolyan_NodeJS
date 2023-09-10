import {TeacherSchedule} from "../models/teacherSchedule.js"

class teacherScheduleService {
    updateByTeacherId = async (teacherId, data) => {
        try {
            return await await TeacherSchedule.findOneAndUpdate(
                {teacherId}, {teacherId, data}, {upsert: true, returnDocument: "after"}
            );

        } catch (e) {
            throw new Error("Ошибка при обновлении расписания по teacherId: " + e.stack)
        }
    }

    getByTeacherId = async (teacherId) => {
        try {
            return await TeacherSchedule.findOne({teacherId})
        } catch (e) {
            throw new Error("Ошибка при получении расписания по teacherId: " + e.stack)
        }
    }
}


export default new teacherScheduleService()