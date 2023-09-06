import {Teacher} from "../models/teacher.js"

class teacherService {
    updateAll = async (teachers) => {
        try {
            await Teacher.deleteMany({})

            await Teacher.insertMany(teachers)
        } catch (e) {
            throw new Error("Ошибка при обновлении всех преподов: " + e.stack)
        }
    }

    findByName = async (name) => {
        try {
            return await Teacher.find({name: {$regex: name, $options: 'i'}});
        } catch (e) {
            throw new Error("Ошибка при поиске препода по имени: " + e.stack)
        }
    }

    getAll = async () => {
        try {
            return await Teacher.find({});
        } catch (e) {
            throw new Error("Ошибка при получении всех преподов: " + e.stack)
        }
    }

    getById = async (_id) => {
        try {
            return await Teacher.findOne({_id});
        } catch (e) {
            throw new Error("Ошибка при получении препода по айди: " + e.stack)
        }
    }
}

export default new teacherService()