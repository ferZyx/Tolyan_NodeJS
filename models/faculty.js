import mongoose from "mongoose"

const facultySchema = new mongoose.Schema({
        name: {type: String, required: true, unique: true},
        id: {type: Number, required: true, unique: true},
    },
    {timestamps: true});
export const Faculty = mongoose.model('Faculty', facultySchema)