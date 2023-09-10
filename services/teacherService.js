import {Teacher} from "../models/teacher.js";


class teacherService{
    getById = async (id) => {
        try {
            return await Teacher.findOne({id})
        } catch (e) {
            throw new Error("Ошибка при получении Teacher по айди: " + e.stack)
        }
    }
    getByDepartmentId = async (departmentId) => {
        try{
            return await Teacher.find({department: departmentId}).sort('name')
        }catch (e) {
            throw new Error("Ошибка при получении Teacher по DepartmentId: " + e.stack)
        }
    }
    getAll = async () => {
        try{
            return await Teacher.find({}).sort('name')
        }catch (e) {
            throw new Error("Ошибка при получении всех Teacher: " + e.stack)
        }
    }

    updateAll = async (teachers) =>{
        try{
            await Teacher.deleteMany({})

            await Teacher.insertMany(teachers)
        }catch (e) {
            console.log(teachers)
            throw new Error("Ошибка при обновлении всех Teacher: " + e.stack)
        }
    }
}

export default new teacherService()