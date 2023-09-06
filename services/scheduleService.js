import {Schedule} from "../models/schedule.js"

class scheduleService {
    updateByGroupId = async (groupId, data) => {
        try {
            return await await Schedule.findOneAndUpdate(
                {groupId}, {groupId, data}, {upsert: true, returnDocument: "after"}
            );

        } catch (e) {
            throw e;
        }
    }

    getByGroupId = async (groupId) => {
        try {
            return await Schedule.findOne({groupId})
        } catch (e) {
            throw new Error(e)
        }
    }
}


export default new scheduleService()