import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        userId: {type: Number, required: true, unique: true},
        userType: {type: String},
        userTitle: {type: String},
        firstName: {type: String},
        lastName: {type: String},
        username: {type: String},
        group: {type: Number, ref: 'Group', field:"id"},
        teacher: {type: Number, ref: 'Teacher', field:"id"},
        scheduleType:{type:String},
        isAdmin:{type:Boolean},
        language:{type:String}
    },
    {
        timestamps: true, // Указываем использовать timestamps
    }
);
export const User = mongoose.model('User', userSchema)

