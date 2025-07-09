import dotenv from "dotenv";
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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
        mobile_number: {
            type: Number,
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

userSchema.methods.isCorrectPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

userSchema.statics.verifyJwt = function (token) {
    try {
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new Error("Invalid JWT");
    }
};

export const User = mongoose.model("User", userSchema);
