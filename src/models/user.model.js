import dotenv from "dotenv";
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
dotenv.config({
    path: "./.env",
});

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

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = parseInt(process.env.SALT);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

export const User = mongoose.model("User", userSchema);
