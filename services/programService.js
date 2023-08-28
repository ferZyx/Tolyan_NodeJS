import {Program} from "../models/program.js"

class programService{
    getByFacultyId = async (facultyId) => {
        try{
            return await Program.find({faculty: facultyId}).sort('name')
        }catch (e) {
            throw e
        }
    }

    getById = async (id) => {
        try{
            return await Program.findOne({id})
        }catch (e) {
            throw e
        }
    }

    updateAll = async (programs) =>{
        try{
            await Program.deleteMany({})
            
            await Program.insertMany(programs)
        }catch (e) {
            throw e
        }
    }

    getAll = async () => {
        try{
            return await Program.find({})
        }catch (e) {
            throw e
        }
    }


}

export default new programService()