import mongoose, { Schema } from "mongoose";

const userSessionSchema = new Schema({
    ip: {
        type: String,
    },
    userId: {
        type: String,
        required: true,
    },
    accessToken: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    loginAt: {
        type: String,
        default: new Date(),
    },
    logoutAt: {
        type: String,
    },
});

export const UserSession = mongoose.model("UserSession", userSessionSchema);
