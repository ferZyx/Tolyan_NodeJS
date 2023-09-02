import {UserActivity} from "../models/user-activity.js";
import {User} from "../models/user.js";

class UserActivityService{
    async getTodayUserActivity(){
        try{
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Обнуляем время для сравнения с началом дня
            return await User.countDocuments({updatedAt: {$gte: today}})
        }catch (e) {
            throw e
        }
    }

    async dailyUserActivityLogging(){
        try{
            const userActivity = await this.getTodayUserActivity()
            return await UserActivity.create({userActivity})
        }catch (e) {
            throw e
        }
    }

    async getWeakUserActivity(){
        try{
            return await UserActivity.find().sort({createdAt:-1}).limit(7)
        }catch (e) {
            throw e
        }
    }
}

export default new UserActivityService()