import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
    name: {type: String, required: true},
    id: {type: Number, required: true},
    href: {type: String, required: true},
    department: {type:Number, ref:"Department", field:'id', required: true}
}, {timestamps:true});

export const Teacher = mongoose.model('Teacher', teacherSchema)

