import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    time: String,
    group: String
});

const teacherScheduleDaySchema = new mongoose.Schema({
    day: String,
    groups: [groupSchema]
});

const teacherScheduleSchema = new mongoose.Schema({
    teacherId:{type:Number, ref:"teacher", field:'id', required: true, unique: false},
    data: [teacherScheduleDaySchema]
}, {timestamps:true});

export const TeacherSchedule = mongoose.model('TeacherSchedule', teacherScheduleSchema);

