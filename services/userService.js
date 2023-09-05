import {User} from "../models/user.js"

class UserService {
    async createUser(userData) {
        try {
            return User.create(userData)
        } catch (error) {
            throw new Error('Ошибка при создании пользователя: ' + error.message);
        }
    }

    async findUserById(userId) {
        try {
            return await User.findOne({userId});
        } catch (error) {
            throw new Error('Ошибка при поиске пользователя: ' + error.message);
        }
    }

    async updateUser(userId, newData) {
        try {
            return await User.findOneAndUpdate({userId: userId}, newData, {new: true});
        } catch (error) {
            throw new Error('Ошибка при обновлении данных пользователя: ' + error.message);
        }
    }

    async getUserById(userId) {
        try {
            return await User.findOne({userId});
        } catch (error) {
            throw new Error('Ошибка при поиске пользователя: ' + error.message);
        }
    }

    async countDocuments(){
        try{
            return await User.countDocuments({})
        }catch (e) {
            throw new Error("Ошибка при получении кол-ва документов юзеров" + e.message)
        }
    }

    async isAdmin(userId){
        try{
            const user = await User.findOne({userId})
            return Boolean(user.isAdmin)
        }catch (e) {
            throw new Error("Ошибка при проверке юзера на админа" + e)
        }
    }

    async getUsersByGroupId(groupId){
        try{
            return await User.find({group:groupId})
        }catch (e) {
            throw e
        }
    }

    async getAll(){
        try{
            return await User.find({})
        }catch (e) {
            throw e
        }
    }

    // updateAll = async (users) => {
    //     try {
    //         await User.deleteMany({})
    //
    //         await User.insertMany(users)
    //     } catch (e) {
    //         throw e
    //     }
    // }

// // Удаление пользователя по ID
//     async deleteUserById(userId) {
//         try {
//             return await User.findOneAndDelete({userId: userId});
//         } catch (error) {
//             throw new Error('Ошибка при удалении пользователя: ' + error.message);
//         }
//     }
}


export default new UserService()
