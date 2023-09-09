import mongoose from "mongoose"

const departmentSchema = new mongoose.Schema({
        name: {type: String, required: true},
        href: {type: String, unique: true, required: true},
        id: {type: Number, unique: true, required: true}
    },
    {timestamps: true});
export const Department = mongoose.model('Department', departmentSchema)