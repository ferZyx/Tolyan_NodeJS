import {Group} from "../models/group.js"

class groupService {
    getByProgramId = async (programId) => {
        try {
            return await Group.find({program: programId}).sort('-id')
        } catch (e) {
            throw new Error("Ошибка при получении группы по програмАйди: " + e.stack)
        }
    }

    getById = async (id) => {
        try {
            return await Group.findOne({id})
        } catch (e) {
            throw new Error("Ошибка при получении группы по айди: " + e.stack)
        }
    }

    getAll = async () => {
        try {
            return await Group.find({})
        } catch (e) {
            throw new Error("Ошибка при получении всех групп: " + e.stack)
        }
    }

    updateAll = async (groups) => {
        try {
            await Group.deleteMany({})

            await Group.insertMany(groups)
        } catch (e) {
            throw new Error("Ошибка при обновлении всех групп: " + e.stack)
        }
    }

    findByName = async (name) => {
        try {
            const regExp = new RegExp(name, "i")
            return await Group.find({name:{$regex:regExp}})
        }catch (e) {
            throw new Error("Ошибка при поиске группы по названию." + e.stack)
        }
    }
}

export default new groupService()