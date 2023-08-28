import {Faculty} from "../models/faculty.js"
import {Program} from "../models/program.js";


class FacultyService {
    getIdByGroup = async (group) => {
        try {
            const program = await Program.findOne({ id: group.program })
            return program.faculty;
        }catch (e) {
            throw e
        }
    }

    getById = async (id) => {
        try {
            return await Faculty.findOne({id})
        } catch (e) {
            throw e
        }
    }

    getAll = async () => {
        try {
            return await Faculty.find({}).sort('id')
        } catch (e) {
            throw e
        }
    }

    updateAll = async (faculties) => {
        try {
            await Faculty.deleteMany({})

            await Faculty.insertMany(faculties)
        } catch (e) {
            throw e
        }
    }


}

export default new FacultyService()


