import {Department} from "../models/department.js";


class departmentService {
    getAll = async () => {
        try {
            return await Department.find({}).sort('id')
        } catch (e) {
            throw new Error("Ошибка при получении всех Department: " + e.stack)
        }
    }

    updateAll = async (faculties) => {
        try {
            await Department.deleteMany({})

            await Department.insertMany(faculties)
        } catch (e) {
            throw new Error("Ошибка при обновлении всех Department: " + e.stack)
        }
    }
}

export default new departmentService()


