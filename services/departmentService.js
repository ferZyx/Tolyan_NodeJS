import {Department} from "../models/department.js";


class departmentService {
    getById = async (id) => {
        try {
            return await Department.findOne({id})
        } catch (e) {
            throw new Error("Ошибка при получении department по айди: " + e.stack)
        }
    }
    getAll = async () => {
        try {
            return await Department.find({}).sort('name')
        } catch (e) {
            throw new Error("Ошибка при получении всех Department: " + e.stack)
        }
    }

    updateAll = async (departments) => {
        try {
            await Department.deleteMany({})

            await Department.insertMany(departments)
        } catch (e) {
            throw new Error("Ошибка при обновлении всех Department: " + e.stack)
        }
    }
}

export default new departmentService()


