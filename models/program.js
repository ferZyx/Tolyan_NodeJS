import mongoose from "mongoose";

const programSchema = new mongoose.Schema({
    name: {type: String, required: true},
    id: {type: Number, required: true},
    href: {type: String, required: true, unique: true},
    faculty: {type:Number, ref:"Faculty", field:'id', required: true, unique: false}
}, {timestamps:true});

export const Program = mongoose.model('Program', programSchema)

