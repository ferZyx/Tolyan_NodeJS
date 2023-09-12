import {BlackList} from "../models/blackList.js";


class blackListService {
    blackList = []

    constructor() {
        this.getAll().then(r => this.blackList = r)
    }

    async isBlackListed(userId){
        try{
            const blackListedUsers = this.blackList
            for(const user of blackListedUsers){
                if (user.userId === userId){
                    return true
                }
            }
            return false

        }catch (e) {
            throw new Error("Ошибка при проверки пользовалея на черный список.")
        }
    }


    async getAll() {
        try {
            return await BlackList.find({})
        } catch (e) {
            throw new Error("Ошибка при получении всех юзеров в черном списке. " + e.message)
        }
    }

    async addToBlackList(userId) {
        try {
            const user = await BlackList.create({userId})
            this.blackList.push(user)
            return
        } catch (e) {
            throw new Error("Ошибка при поптыке добавить юзера в блек лист. " + e.message)
        }
    }
}

export default new blackListService()