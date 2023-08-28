import {Schedule} from "../models/schedule.js"

class scheduleService {
    updateByGroupId = async (groupId, data) => {
        try {
            const updatedSchedule = await Schedule.findOneAndUpdate(
                { groupId },
                { groupId },
                { upsert: true, new: true }
            );

            updatedSchedule.data = data;
            return await updatedSchedule.save();
        } catch (e) {
            throw new Error(e);
        }
    }

    getByGroupId = async (groupId) => {
        try{
            return await Schedule.findOne({groupId})
        }catch (e) {
            throw new Error(e)
        }
    }
}


export default new scheduleService()