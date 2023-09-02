import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema({
    userActivity:Number,
}, {timestamps:true});

export const UserActivity = mongoose.model('User-Activity', userActivitySchema);

