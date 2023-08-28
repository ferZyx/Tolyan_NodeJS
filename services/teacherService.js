import {Teacher} from "../models/teacher.js"

class teacherService {
    updateAll = async (teachers) => {
        try {
            await Teacher.deleteMany({})

            await Teacher.insertMany(teachers)
        } catch (e) {
            throw new Error(e)
        }
    }

    findByName = async (name) => {
        try {
            return await Teacher.find({name: {$regex: name, $options: 'i'}});
        } catch (e) {
            throw new Error(e)
        }
    }

    getAll = async () => {
        try {
            return await Teacher.find({});
        } catch (e) {
            throw new Error(e)
        }
    }

    getById = async (_id) => {
        try {
            return await Teacher.findOne({_id});
        } catch (e) {
            throw new Error(e)
        }
    }
}

export default new teacherService()