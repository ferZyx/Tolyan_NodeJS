import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: {type: String},
    id: {type: Number},
    language: {type: String},
    href:{type:String, unique:true},
    age:{type:Number},
    studentCount:{type:Number},
    program:{type:Number, ref:"Program", field:'id', required: true, unique: false},
}, {timestamps:true});

export const Group = mongoose.model('Group', groupSchema);

