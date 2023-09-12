import mongoose from "mongoose";

const blackListSchema = new mongoose.Schema(
    {
        userId: {type: Number, required: true, unique: true},
    },
    {
        timestamps: true, // Указываем использовать timestamps
    }
);
export const BlackList = mongoose.model('Black-List', blackListSchema)

