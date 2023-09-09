import {User} from "../models/user.js"
import log from "../logging/logging.js";

class UserService {
    async registerUser(msg) {
        try {
            const User = await this.findUserById(msg.chat.id)
            if (!User) {
                await this.createUser({
                    userId: msg.chat.id,
                    userType: String(msg.chat.type),
                    userTitle: msg.chat.title,
                    firstName: msg.chat.first_name,
                    lastName: msg.chat.last_name,
                    username: msg.chat.username,
                }).then(user => log.warn(`Зарегистрирован новый пользователь! /get_user${msg.chat.id}`, {
                    user,
                    userId: msg.chat.id
                }))
            }
        } catch (e) {
            log.error("Ошибка при попытке зарегестрировать пользователя", {stack: e.stack, msg, userId: msg.chat.id})
        }
    }

    async createUser(userData) {
        try {
            return User.create(userData)
        } catch (error) {
            throw new Error('Ошибка при создании пользователя: ' + error.stack);
        }
    }

    async findUserById(userId) {
        try {
            return await User.findOne({userId});
        } catch (error) {
            throw new Error('Ошибка при поиске пользователя: ' + error.stack);
        }
    }

    async updateUser(userId, newData) {
        try {
            return await User.findOneAndUpdate({userId: userId}, newData, {new: true});
        } catch (error) {
            throw new Error('Ошибка при обновлении данных пользователя: ' + error.stack);
        }
    }

    async getUserById(userId) {
        try {
            return await User.findOne({userId});
        } catch (error) {
            throw new Error('Ошибка при поиске пользователя: ' + error.stack);
        }
    }

    async countDocuments() {
        try {
            return await User.countDocuments({})
        } catch (e) {
            throw new Error("Ошибка при получении кол-ва документов юзеров: " + e.stack)
        }
    }

    async isAdmin(userId) {
        try {
            const user = await User.findOne({userId})
            return Boolean(user.isAdmin)
        } catch (e) {
            throw new Error("Ошибка при проверке юзера на админа: " + e.stack)
        }
    }

    async getUsersCountByGroupId(groupId) {
        try {
            return await User.countDocuments({group: groupId})
        } catch (e) {
            throw new Error("Ошибка при получении пользователей по полю групАйди: " + e.stack)
        }
    }

    async getAll() {
        try {
            return await User.find({})
        } catch (e) {
            throw new Error("Ошибка при получении всех пользователей: " + e.stack)
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
