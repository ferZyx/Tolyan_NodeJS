import {TeacherProfile} from "../models/teacherProfile.js"

class teacherProfileService {
    updateAll = async (teachers) => {
        try {
            await TeacherProfile.deleteMany({})

            await TeacherProfile.insertMany(teachers)
        } catch (e) {
            throw new Error("Ошибка при обновлении всех преподов: " + e.stack)
        }
    }

    findByName = async (name) => {
        try {
            return await TeacherProfile.find({name: {$regex: name, $options: 'i'}});
        } catch (e) {
            throw new Error("Ошибка при поиске препода по имени: " + e.stack)
        }
    }

    getAll = async () => {
        try {
            return await TeacherProfile.find({});
        } catch (e) {
            throw new Error("Ошибка при получении всех преподов: " + e.stack)
        }
    }

    getById = async (_id) => {
        try {
            return await TeacherProfile.findOne({_id});
        } catch (e) {
            throw new Error("Ошибка при получении препода по айди: " + e.stack)
        }
    }
}

export default new teacherProfileService()