import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        fullName: {
            type: String,
            required: [true, "Please tell us your name!"],
            trim: true,
        },
        profile_image: {
            type: String,
        },
        email: {
            type: String,
            required: [true, "Please provide your email"],
            unique: true,
            lowecase: true,
        },
        password: {
            type: String,
            required: [true, "Please enter password"],
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export const User = mongoose.model("User", userSchema);
