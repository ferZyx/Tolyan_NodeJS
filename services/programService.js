import {Program} from "../models/program.js"

class programService{
    getByFacultyId = async (facultyId) => {
        try{
            return await Program.find({faculty: facultyId}).sort('name')
        }catch (e) {
            throw new Error("Ошибка при получении программы по факультиАйди: " + e.stack)
        }
    }

    getById = async (id) => {
        try{
            return await Program.findOne({id})
        }catch (e) {
            throw new Error("Ошибка при получении программы по айди: " + e.stack)
        }
    }

    updateAll = async (programs) =>{
        try{
            await Program.deleteMany({})
            
            await Program.insertMany(programs)
        }catch (e) {
            throw new Error("Ошибка при обновлении всех программ: " + e.stack)
        }
    }

    getAll = async () => {
        try{
            return await Program.find({})
        }catch (e) {
            throw new Error("Ошибка при получении всех программ: " + e.stack)
        }
    }


}

export default new programService()