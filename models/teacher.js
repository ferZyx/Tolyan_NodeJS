import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
    name: {type: String},
    faculty: {type: String},
    department: {type: String},
    href: {type: String},
}, {timestamps:true});

export const Teacher = mongoose.model('Teacher', teacherSchema);

