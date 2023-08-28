import {Group} from "../models/group.js"

class groupService{
    getByProgramId = async (programId) => {
        try{
            return await Group.find({program: programId}).sort('-id')
        }catch (e) {
            throw new Error(e)
        }
    }

    getById = async (id) => {
        try{
            return await Group.findOne({id})
        }catch (e) {
            throw e
        }
    }
    
    updateAll = async (groups) =>{
        try{
            await Group.deleteMany({})
            
            await Group.insertMany(groups)
        }catch (e) {
            throw e
        }
    }
}

export default new groupService()