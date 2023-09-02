import {UserActivity} from "../models/user-activity.js";
import {User} from "../models/user.js";

class UserActivityService{
    async getTodayUserCount(){
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
            const userActivity = await this.getTodayUserCount()
            return await UserActivity.create({userActivity})
        }catch (e) {
            throw e
        }
    }

    async getWeakUserActivity(){
        try{
            const weakUserActivity =  await UserActivity.find().sort({createdAt:-1}).limit(7)
            const weakUserCount = await this.getWeakUserCount()
            return {weakUserActivity, weakUserCount}
        }catch (e) {
            throw e
        }
    }

    async getWeakUserCount(){
        try{
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Обнуляем время для сравнения с началом дня

            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(today.getDate() - 6);

            return await User.countDocuments({
                updatedAt: { $gte: oneWeekAgo, $lte: today } // Между одной неделей назад и сегодняшней датой
            });
        }catch (e) {
            throw e
        }
    }
}

export default new UserActivityService()