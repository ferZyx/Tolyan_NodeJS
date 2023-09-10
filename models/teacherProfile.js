import mongoose from "mongoose";

const teacherProfileSchema = new mongoose.Schema({
    name: {type: String},
    faculty: {type: String},
    department: {type: String},
    href: {type: String},
}, {timestamps:true});

export const TeacherProfile = mongoose.model('Teacher-Profile', teacherProfileSchema);

