import {userRegistrationStat} from "../models/user-regiistration-stat.js";
import {User} from "../models/user.js";

class UserRegistrationStatService {
    async getTodayRegisteredUserCount(){
        try{
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Обнуляем время для сравнения с началом дня
            return await User.countDocuments({createdAt: {$gte: today}})
        }catch (e) {
            throw e
        }
    }

    async dailyRegisteredUserCountLogging(){
        try{
            const registeredUsers = await this.getTodayRegisteredUserCount()
            return await userRegistrationStat.create({registeredUsers})
        }catch (e) {
            throw e
        }
    }

    async getWeakRegisteredUserCount(){
        try{
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Обнуляем время для сравнения с началом дня

            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(today.getDate() - 6);

            return await User.countDocuments({
                createdAt: { $gte: oneWeekAgo} // Между одной неделей назад и сегодняшней датой
            });
        }catch (e) {
            throw e
        }
    }

    async getWeakRegistrationStat(){
        try{
            const weakRegistrationStat =  await userRegistrationStat.find().sort({createdAt:-1}).limit(7)
            const weakRegisteredUserCount = await this.getWeakRegisteredUserCount()
            return {weakRegistrationStat, weakRegisteredUserCount}
        }catch (e) {
            throw e
        }
    }

}

export default new UserRegistrationStatService()