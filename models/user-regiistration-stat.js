import mongoose from "mongoose";

const userRegistrationStatSchema = new mongoose.Schema({
    registeredUsers:Number,
}, {timestamps:true});

export const userRegistrationStat = mongoose.model('UserRegistrationStat', userRegistrationStatSchema);

