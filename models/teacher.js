import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
    name: {type: String, required: true},
    id: {type: Number, required: true},
    href: {type: String, required: true, unique: true},
    department: {type:Number, ref:"Department", field:'id', required: true, unique: false}
}, {timestamps:true});

export const Program = mongoose.model('Program', programSchema)

