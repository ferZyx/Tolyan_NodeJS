import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
    time: String,
    subject: String
});

const scheduleDaySchema = new mongoose.Schema({
    day: String,
    subjects: [subjectSchema]
});

const scheduleSchema = new mongoose.Schema({
    groupId: { type: Number, unique: true },
    data: [scheduleDaySchema]
}, {timestamps:true});

export const Schedule = mongoose.model('Schedule', scheduleSchema);

