import {Schema, model} from "mongoose";

const LogSchema = new Schema({
    level:String,
    message:String,
    meta: Schema.Types.Mixed
    }, {
        timestamps: true,
    },
)

export default model("Log", LogSchema)