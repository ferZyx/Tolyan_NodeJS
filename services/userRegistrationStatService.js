import {userRegistrationStat} from "../models/user-regiistration-stat.js";
import {User} from "../models/user.js";
import log from "../logging/logging.js";

class UserRegistrationStatService {
    async getTodayRegisteredUserCount(){
        try{
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Обнуляем время для сравнения с началом дня
            return await User.countDocuments({createdAt: {$gte: today}})
        }catch (e) {
            throw new Error("Ошибка при получении кол-ва зарегестрированных юзеров сегодня: " + e.stack)
        }
    }

    async dailyRegisteredUserCountLogging(){
        try{
            const registeredUsers = await this.getTodayRegisteredUserCount()
            userRegistrationStat.create({registeredUsers})
                .then(() => log.warn("Произошла запись зарегестрированных юзеров!"))
        }catch (e) {
            throw new Error("Ошибка при логировании кол-ва зарегестрированных юзеров сегодня: " + e.stack)
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
            throw new Error("Ошибка при получении кол-ва зарегестрированных юзеров неделю: " + e.stack)
        }
    }

    async getWeakRegistrationStat(){
        try{
            const weakRegistrationStat =  await userRegistrationStat.find().sort({createdAt:-1}).limit(7)
            const weakRegisteredUserCount = await this.getWeakRegisteredUserCount()
            return {weakRegistrationStat, weakRegisteredUserCount}
        }catch (e) {
            throw new Error("Ошибка при получении статистики регистраций юзеров в течении недели: " + e.stack)
        }
    }

}

export default new UserRegistrationStatService()