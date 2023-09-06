import {Schedule} from "../models/schedule.js"

class scheduleService {
    updateByGroupId = async (groupId, data) => {
        try {
            return await await Schedule.findOneAndUpdate(
                {groupId}, {groupId, data}, {upsert: true, returnDocument: "after"}
            );

        } catch (e) {
            throw new Error("Ошибка при обновлении расписания по групАйди: " + e.stack)
        }
    }

    getByGroupId = async (groupId) => {
        try {
            return await Schedule.findOne({groupId})
        } catch (e) {
            throw new Error("Ошибка при получении расписания по группАйди: " + e.stack)
        }
    }
}


export default new scheduleService()